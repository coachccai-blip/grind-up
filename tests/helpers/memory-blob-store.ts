import type {
  BlobStore,
  ReadResult,
  WriteCondition,
  WriteResult,
} from '../../server/db/blob-store.js'

/**
 * Stockage en mémoire pour les tests, avec les mêmes règles d'écriture
 * conditionnelle que Netlify Blobs. Il permet aussi de simuler un autre
 * écrivain ou une panne au moment d'une écriture.
 */
export class MemoryBlobStore implements BlobStore {
  private readonly blobs = new Map<string, { bytes: Uint8Array; etag: string }>()
  private version = 0

  /** Compteurs d'appels, pour vérifier ce que le code demande au stockage. */
  readonly calls = { read: 0, write: 0, list: 0, delete: 0 }

  /** Appelée juste avant chaque écriture : permet de glisser une écriture concurrente ou une panne. */
  beforeWrite: ((key: string) => void | Promise<void>) | null = null

  async read(key: string, knownEtag?: string): Promise<ReadResult> {
    this.calls.read += 1
    const blob = this.blobs.get(key)
    if (!blob) return { status: 'missing' }
    if (knownEtag && blob.etag === knownEtag) return { status: 'unchanged' }
    return { status: 'found', blob: { bytes: blob.bytes.slice(), etag: blob.etag } }
  }

  async write(key: string, bytes: Uint8Array, condition?: WriteCondition): Promise<WriteResult> {
    this.calls.write += 1
    await this.beforeWrite?.(key)
    return this.writeNow(key, bytes, condition)
  }

  /** Écriture directe, sans passer par `beforeWrite` : sert à jouer le rôle d'un autre écrivain. */
  writeNow(key: string, bytes: Uint8Array, condition?: WriteCondition): WriteResult {
    const current = this.blobs.get(key)
    if (condition && 'ifAbsent' in condition && current) return { written: false }
    if (condition && 'ifMatch' in condition && current?.etag !== condition.ifMatch) {
      return { written: false }
    }
    this.version += 1
    const etag = `"v${this.version}"`
    this.blobs.set(key, { bytes: bytes.slice(), etag })
    return { written: true, etag }
  }

  async list(prefix: string): Promise<string[]> {
    this.calls.list += 1
    return [...this.blobs.keys()].filter((key) => key.startsWith(prefix))
  }

  async delete(key: string): Promise<void> {
    this.calls.delete += 1
    this.blobs.delete(key)
  }

  describe(): string {
    return 'stockage en mémoire (tests)'
  }

  /** Contenu brut d'un fichier, pour les vérifications. */
  peek(key: string): Uint8Array | undefined {
    return this.blobs.get(key)?.bytes
  }

  keys(): string[] {
    return [...this.blobs.keys()].sort()
  }
}
