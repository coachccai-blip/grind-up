import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setEnvironmentContext } from '@netlify/blobs'
import { BlobsServer } from '@netlify/blobs/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { NetlifyBlobStore } from '../../server/db/blob-store.js'
import { SqliteBlobDatabase } from '../../server/db/database.js'
import { migrations } from '../../server/db/migrations/index.js'

/**
 * Le vrai client Netlify Blobs, branché sur le serveur local fourni par Netlify
 * pour les tests : on vérifie ici les écritures conditionnelles telles que le
 * client les émet, pas une imitation.
 */
let server: BlobsServer
let directory: string

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'grind-up-blobs-'))
  server = new BlobsServer({ directory, token: 'test-token' })
  const { port } = await server.start()
  setEnvironmentContext({
    edgeURL: `http://localhost:${port}`,
    // Adresse sans cache : c'est elle que le client utilise en cohérence forte.
    uncachedEdgeURL: `http://localhost:${port}`,
    siteID: 'test-site',
    token: 'test-token',
  })
})

afterAll(async () => {
  await server.stop()
  await rm(directory, { recursive: true, force: true })
})

const bytes = (text: string) => new TextEncoder().encode(text)
const text = (data: Uint8Array) => new TextDecoder().decode(data)

describe('NetlifyBlobStore', () => {
  it('signale un fichier absent', async () => {
    const store = new NetlifyBlobStore('lecture')

    expect(await store.read('absent')).toEqual({ status: 'missing' })
  })

  it('relit exactement ce qui a été écrit, octets binaires compris', async () => {
    const store = new NetlifyBlobStore('aller-retour')
    const binary = Uint8Array.from({ length: 512 }, (_, index) => index % 256)

    const written = await store.write('fichier', binary)
    const read = await store.read('fichier')

    expect(written.written).toBe(true)
    expect(read.status).toBe('found')
    if (read.status === 'found' && written.written) {
      expect([...read.blob.bytes]).toEqual([...binary])
      expect(read.blob.etag).toBe(written.etag)
    }
  })

  it("n'écrit « si absent » qu'une seule fois", async () => {
    const store = new NetlifyBlobStore('si-absent')

    const first = await store.write('cle', bytes('premier'), { ifAbsent: true })
    const second = await store.write('cle', bytes('second'), { ifAbsent: true })
    const read = await store.read('cle')

    expect(first.written).toBe(true)
    expect(second).toEqual({ written: false })
    expect(read.status === 'found' && text(read.blob.bytes)).toBe('premier')
  })

  it('refuse une écriture fondée sur une version dépassée', async () => {
    const store = new NetlifyBlobStore('si-inchange')
    const v1 = await store.write('cle', bytes('v1'))
    if (!v1.written) throw new Error('écriture initiale refusée')

    const v2 = await store.write('cle', bytes('v2'), { ifMatch: v1.etag })
    const stale = await store.write('cle', bytes('en retard'), { ifMatch: v1.etag })
    const read = await store.read('cle')

    expect(v2.written).toBe(true)
    expect(stale).toEqual({ written: false })
    expect(read.status === 'found' && text(read.blob.bytes)).toBe('v2')
  })

  it('reconnaît une version déjà connue sans la renvoyer', async () => {
    const store = new NetlifyBlobStore('inchange')
    const written = await store.write('cle', bytes('contenu'))
    if (!written.written) throw new Error('écriture initiale refusée')

    expect(await store.read('cle', written.etag)).toEqual({ status: 'unchanged' })
    expect((await store.read('cle', '"autre-version"')).status).toBe('found')
  })

  it('liste par préfixe et supprime', async () => {
    const store = new NetlifyBlobStore('liste')
    await store.write('backups/a', bytes('a'))
    await store.write('backups/b', bytes('b'))
    await store.write('db/main', bytes('m'))

    expect((await store.list('backups/')).sort()).toEqual(['backups/a', 'backups/b'])

    await store.delete('backups/a')
    expect(await store.list('backups/')).toEqual(['backups/b'])
  })
})

describe('base SQLite sur Netlify Blobs', () => {
  /**
   * Magasin qui laisse passer une autre écriture juste avant la sienne, pour
   * provoquer un conflit à coup sûr. L'émulateur local tire ses étiquettes de
   * l'heure de modification du fichier, à la milliseconde près : on espace les
   * écritures pour que deux versions ne se confondent pas.
   */
  class InterleavingStore extends NetlifyBlobStore {
    beforeNextWrite: (() => Promise<unknown>) | undefined

    override async write(...args: Parameters<NetlifyBlobStore['write']>) {
      const interleave = this.beforeNextWrite
      this.beforeNextWrite = undefined
      await interleave?.()
      await new Promise((resolve) => setTimeout(resolve, 5))
      return super.write(...args)
    }
  }

  const open = (store: NetlifyBlobStore) =>
    new SqliteBlobDatabase({
      store,
      key: 'db/main.sqlite',
      migrations,
      backups: { prefix: 'backups/main/', keep: 7 },
    })
  const ping = (database: SqliteBlobDatabase) =>
    database.write((tx) => tx.run('INSERT INTO health_pings (pinged_at) VALUES (?)', ['x']))
  const countPings = (database: SqliteBlobDatabase) =>
    database.read(
      (tx) => tx.get<{ total: number }>('SELECT count(*) AS total FROM health_pings')?.total,
    )

  it('ne perd aucune écriture quand une autre instance écrit entre-temps', async () => {
    const firstStore = new InterleavingStore('base')
    const first = open(firstStore)
    const second = open(new InterleavingStore('base'))

    await ping(first)
    await ping(second)
    // La seconde instance écrit pendant que la première s'apprête à enregistrer :
    // l'écriture de la première est refusée, puis rejouée sur la nouvelle version.
    firstStore.beforeNextWrite = () => ping(second)
    await ping(first)

    expect(await countPings(second)).toBe(4)
    await first.reload()
    expect(await countPings(first)).toBe(4)
    expect(await first.listBackups()).toHaveLength(1)
  })
})
