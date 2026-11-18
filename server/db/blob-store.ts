import { getStore } from '@netlify/blobs'

/**
 * Stockage de fichiers avec écriture conditionnelle.
 *
 * La base de Grind up est un fichier SQLite rangé dans ce stockage. Chaque version
 * du fichier porte une étiquette (ETag) : une écriture n'est acceptée que si
 * l'étiquette n'a pas changé depuis la lecture. Deux requêtes simultanées ne
 * peuvent donc pas s'écraser l'une l'autre.
 */
export interface StoredBlob {
  bytes: Uint8Array
  etag: string
}

export type ReadResult =
  | { status: 'missing' }
  /** La version connue de l'appelant est toujours la version en place. */
  | { status: 'unchanged' }
  | { status: 'found'; blob: StoredBlob }

export type WriteCondition =
  /** N'écrire que si le fichier n'existe pas encore. */
  | { ifAbsent: true }
  /** N'écrire que si la version en place porte cette étiquette. */
  | { ifMatch: string }

export type WriteResult = { written: true; etag: string } | { written: false }

export interface BlobStore {
  read(key: string, knownEtag?: string): Promise<ReadResult>
  write(key: string, bytes: Uint8Array, condition?: WriteCondition): Promise<WriteResult>
  list(prefix: string): Promise<string[]>
  delete(key: string): Promise<void>
  /** Description du stockage, pour le diagnostic. */
  describe(): string
}

type NetlifyStore = ReturnType<typeof getStore>

/** Nombre d'essais pour obtenir un contenu et son étiquette qui vont ensemble (voir readThroughListing). */
const LISTING_READ_ATTEMPTS = 5

/** Stockage Netlify Blobs, en cohérence forte : une lecture voit toujours la dernière écriture. */
export class NetlifyBlobStore implements BlobStore {
  /**
   * Vrai si le service renvoie l'étiquette avec le contenu (cas de Netlify).
   * L'émulateur local de Netlify ne le fait pas : on la lit alors dans la liste des fichiers.
   */
  private etagComesWithContent: boolean | undefined

  constructor(private readonly storeName: string) {}

  describe(): string {
    const mode =
      this.etagComesWithContent === undefined
        ? 'aucune lecture pour l’instant'
        : this.etagComesWithContent
          ? 'étiquette fournie avec le contenu'
          : 'étiquette lue dans la liste des fichiers'
    return `Netlify Blobs, magasin « ${this.storeName} » (${mode})`
  }

  /**
   * Le magasin est rouvert à chaque opération : Netlify fournit ses accès
   * pendant le traitement d'une requête, et ils peuvent changer d'une requête à l'autre.
   */
  private open(): NetlifyStore {
    return getStore({ name: this.storeName, consistency: 'strong' })
  }

  async read(key: string, knownEtag?: string): Promise<ReadResult> {
    const store = this.open()
    if (this.etagComesWithContent === false) return this.readThroughListing(store, key, knownEtag)

    // Le client renvoie null si le fichier n'existe pas, et `data: null` si la
    // version connue est toujours en place (ses types ne le disent pas).
    const entry = (await store.getWithMetadata(key, {
      type: 'arrayBuffer',
      consistency: 'strong',
      ...(knownEtag ? { etag: knownEtag } : {}),
    })) as { data: ArrayBuffer | null; etag?: string } | null

    if (entry === null) return { status: 'missing' }
    if (!entry.etag) {
      this.etagComesWithContent = false
      return this.readThroughListing(store, key, knownEtag)
    }
    this.etagComesWithContent = true
    if (knownEtag && entry.etag === knownEtag) return { status: 'unchanged' }
    if (entry.data === null) return this.read(key)
    return { status: 'found', blob: { bytes: new Uint8Array(entry.data), etag: entry.etag } }
  }

  /**
   * Lecture quand le service ne renvoie pas l'étiquette avec le contenu : on lit
   * l'étiquette dans la liste avant et après le contenu, et on ne garde le
   * résultat que si elle n'a pas bougé entre les deux.
   */
  private async readThroughListing(
    store: NetlifyStore,
    key: string,
    knownEtag?: string,
  ): Promise<ReadResult> {
    for (let attempt = 0; attempt < LISTING_READ_ATTEMPTS; attempt += 1) {
      const before = await this.etagFromListing(store, key)
      if (!before) return { status: 'missing' }
      if (knownEtag && before === knownEtag) return { status: 'unchanged' }

      const data = (await store.get(key, {
        type: 'arrayBuffer',
        consistency: 'strong',
      })) as ArrayBuffer | null
      if (data === null) return { status: 'missing' }

      const after = await this.etagFromListing(store, key)
      if (before === after) {
        return { status: 'found', blob: { bytes: new Uint8Array(data), etag: before } }
      }
    }
    throw new Error(`Lecture de « ${key} » impossible : le fichier change trop vite.`)
  }

  private async etagFromListing(store: NetlifyStore, key: string): Promise<string | undefined> {
    const { blobs } = await store.list({ prefix: key })
    return blobs.find((blob) => blob.key === key)?.etag || undefined
  }

  async write(key: string, bytes: Uint8Array, condition?: WriteCondition): Promise<WriteResult> {
    const store = this.open()
    // Copie dans un ArrayBuffer autonome : `bytes` peut être une vue sur une mémoire plus grande.
    const body = bytes.slice().buffer
    const options = !condition
      ? {}
      : 'ifAbsent' in condition
        ? { onlyIfNew: true }
        : { onlyIfMatch: condition.ifMatch }

    const result = await store.set(key, body, options)
    if (!result.modified) return { written: false }

    const etag = result.etag || (await this.etagFromListing(store, key))
    if (!etag) {
      throw new Error(`Le stockage n’a pas renvoyé d’étiquette après l’écriture de « ${key} ».`)
    }
    return { written: true, etag }
  }

  async list(prefix: string): Promise<string[]> {
    const { blobs } = await this.open().list({ prefix })
    return blobs.map((blob) => blob.key)
  }

  async delete(key: string): Promise<void> {
    await this.open().delete(key)
  }
}
