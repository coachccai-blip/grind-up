import { describe, expect, it, vi } from 'vitest'
import { SqliteBlobDatabase, WriteConflictError } from '../../server/db/database.js'
import { MigrationError, type Migration } from '../../server/db/migrate.js'
import { loadSqlite, type SqlReader, type SqlWriter } from '../../server/db/sqlite.js'
import { MemoryBlobStore } from '../helpers/memory-blob-store.js'

const KEY = 'db/test.sqlite'

const createNotes: Migration = {
  id: '0001_create_notes',
  sql: 'CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT NOT NULL) STRICT;',
}

function openDatabase(
  store: MemoryBlobStore,
  options: Partial<ConstructorParameters<typeof SqliteBlobDatabase>[0]> = {},
): SqliteBlobDatabase {
  return new SqliteBlobDatabase({
    store,
    key: KEY,
    migrations: [createNotes],
    backups: null,
    sleep: async () => undefined,
    ...options,
  })
}

const addNote = (body: string) => (tx: SqlWriter) =>
  tx.run('INSERT INTO notes (body) VALUES (?)', [body])

const listNotes = (tx: SqlReader) =>
  tx.all<{ body: string }>('SELECT body FROM notes ORDER BY id').map((row) => row.body)

describe('base SQLite dans un stockage de fichiers', () => {
  it('crée le fichier à la première écriture, migrations comprises', async () => {
    const store = new MemoryBlobStore()
    const database = openDatabase(store)

    await database.write(addNote('première'))

    expect(store.keys()).toEqual([KEY])
    // Le fichier enregistré est une vraie base SQLite, lisible sans passer par le moteur.
    const sqlite = await loadSqlite()
    const file = new sqlite.Database(store.peek(KEY))
    expect(file.exec('SELECT body FROM notes')[0]?.values).toEqual([['première']])
    expect(file.exec('SELECT id FROM schema_migrations')[0]?.values).toEqual([
      ['0001_create_notes'],
    ])
  })

  it('enregistre la structure dès la première lecture', async () => {
    const store = new MemoryBlobStore()
    const database = openDatabase(store)

    expect(await database.read(listNotes)).toEqual([])
    expect(store.keys()).toEqual([KEY])
  })

  it('montre les écritures aux autres instances de fonction', async () => {
    const store = new MemoryBlobStore()
    const first = openDatabase(store)
    const second = openDatabase(store)

    await first.write(addNote('depuis la première instance'))
    expect(await second.read(listNotes)).toEqual(['depuis la première instance'])

    await second.write(addNote('depuis la seconde'))
    expect(await first.read(listNotes)).toEqual([
      'depuis la première instance',
      'depuis la seconde',
    ])
  })

  it('ne retélécharge pas un fichier inchangé', async () => {
    const store = new MemoryBlobStore()
    const database = openDatabase(store)
    await database.write(addNote('a'))
    const read = vi.spyOn(store, 'read')

    await database.read(listNotes)
    await database.read(listNotes)

    const results = await Promise.all(read.mock.results.map((call) => call.value))
    expect(results.map((result) => result.status)).toEqual(['unchanged', 'unchanged'])
  })

  it('rejoue une écriture quand une autre instance a écrit entre-temps', async () => {
    const store = new MemoryBlobStore()
    const first = openDatabase(store)
    const second = openDatabase(store)
    await first.write(addNote('initiale'))

    // Juste avant que la première instance n'enregistre, la seconde écrit.
    store.beforeWrite = async () => {
      store.beforeWrite = null
      await second.write(addNote('concurrente'))
    }
    await first.write(addNote('rejouée'))

    // Aucune écriture perdue : les deux sont présentes.
    expect(await first.read(listNotes)).toEqual(['initiale', 'concurrente', 'rejouée'])
    expect(await second.read(listNotes)).toEqual(['initiale', 'concurrente', 'rejouée'])
  })

  it("n'applique qu'une fois un changement protégé par son état, même en course", async () => {
    const creditOnce: Migration = {
      id: '0001_create_credit_tables',
      sql: `
        CREATE TABLE assignments (id INTEGER PRIMARY KEY, status TEXT NOT NULL) STRICT;
        CREATE TABLE xp_entries (id INTEGER PRIMARY KEY, assignment_id INTEGER NOT NULL, amount INTEGER NOT NULL) STRICT;
        INSERT INTO assignments (id, status) VALUES (1, 'submitted');
      `,
    }
    const store = new MemoryBlobStore()
    const instances = [1, 2, 3].map(() => openDatabase(store, { migrations: [creditOnce] }))

    // La même validation arrive trois fois en même temps (double clic, requête rejouée).
    const validate = (database: SqliteBlobDatabase) =>
      database.write((tx) => {
        const current = tx.get<{ status: string }>('SELECT status FROM assignments WHERE id = 1')
        if (current?.status === 'validated') return 'ignorée'
        tx.run(`UPDATE assignments SET status = 'validated' WHERE id = 1`)
        tx.run('INSERT INTO xp_entries (assignment_id, amount) VALUES (1, 100)')
        return 'créditée'
      })
    const outcomes = await Promise.all(instances.map(validate))

    expect(outcomes.filter((outcome) => outcome === 'créditée')).toHaveLength(1)
    const journal = await instances[0]!.read((tx) =>
      tx.get<{ lines: number; xp: number }>(
        'SELECT count(*) AS lines, sum(amount) AS xp FROM xp_entries',
      ),
    )
    expect(journal).toEqual({ lines: 1, xp: 100 })
  })

  it('abandonne après le nombre maximal de conflits', async () => {
    const store = new MemoryBlobStore()
    const database = openDatabase(store, { maxWriteAttempts: 3 })
    await database.write(addNote('initiale'))

    // Le fichier change avant chaque tentative d'enregistrement.
    let intruder = 0
    store.beforeWrite = () => {
      intruder += 1
      store.writeNow(KEY, store.peek(KEY)!)
    }

    await expect(database.write(addNote('jamais enregistrée'))).rejects.toBeInstanceOf(
      WriteConflictError,
    )
    expect(intruder).toBe(3)
    store.beforeWrite = null
    expect(await database.read(listNotes)).toEqual(['initiale'])
  })

  it("n'enregistre rien quand le changement échoue en cours de route", async () => {
    const store = new MemoryBlobStore()
    const database = openDatabase(store)
    await database.write(addNote('avant'))
    const writesBefore = store.calls.write

    await expect(
      database.write((tx) => {
        tx.run('INSERT INTO notes (body) VALUES (?)', ['à moitié faite'])
        throw new Error('règle métier violée')
      }),
    ).rejects.toThrow('règle métier violée')

    expect(store.calls.write).toBe(writesBefore)
    expect(await database.read(listNotes)).toEqual(['avant'])
  })

  it('se remet d’une panne du stockage pendant une écriture', async () => {
    const store = new MemoryBlobStore()
    const database = openDatabase(store)
    await database.write(addNote('avant la panne'))

    store.beforeWrite = () => {
      store.beforeWrite = null
      throw new Error('stockage indisponible')
    }
    await expect(database.write(addNote('perdue'))).rejects.toThrow('stockage indisponible')

    // L'écriture en panne n'a laissé aucune trace, ni dans le stockage ni en mémoire.
    expect(await database.read(listNotes)).toEqual(['avant la panne'])
    await database.write(addNote('après la panne'))
    expect(await database.read(listNotes)).toEqual(['avant la panne', 'après la panne'])
  })

  it('interdit toute modification pendant une lecture', async () => {
    const store = new MemoryBlobStore()
    const database = openDatabase(store)
    await database.write(addNote('intacte'))

    // Même une instruction d'écriture glissée dans une lecture est refusée par SQLite.
    await expect(database.read((tx) => tx.all('DELETE FROM notes RETURNING id'))).rejects.toThrow(
      /readonly/,
    )
    expect(await database.read(listNotes)).toEqual(['intacte'])
  })

  it('refuse une fonction de changement asynchrone', async () => {
    const database = openDatabase(new MemoryBlobStore())

    await expect(database.write(async () => 'trop tard')).rejects.toThrow(/synchrone/)
  })

  it('traite une à une les opérations lancées en même temps sur une instance', async () => {
    const store = new MemoryBlobStore()
    const database = openDatabase(store)

    await Promise.all(
      Array.from({ length: 10 }, (_, index) => database.write(addNote(`n${index}`))),
    )

    expect(await database.read(listNotes)).toHaveLength(10)
  })

  it('relit le fichier depuis le stockage après reload()', async () => {
    const store = new MemoryBlobStore()
    const database = openDatabase(store)
    await database.write(addNote('a'))
    const read = vi.spyOn(store, 'read')

    await database.reload()
    await database.read(listNotes)

    const result = await read.mock.results[0]!.value
    expect(result.status).toBe('found')
  })
})

describe('migrations', () => {
  const addAuthor: Migration = {
    id: '0002_add_note_author',
    sql: `ALTER TABLE notes ADD COLUMN author TEXT NOT NULL DEFAULT 'inconnu';`,
  }

  it('applique une nouvelle migration au premier appel, sans perdre les données', async () => {
    const store = new MemoryBlobStore()
    await openDatabase(store).write(addNote('ancienne'))

    // Nouvelle version du code, avec une migration de plus.
    const upgraded = openDatabase(store, { migrations: [createNotes, addAuthor] })
    const rows = await upgraded.read((tx) => tx.all('SELECT body, author FROM notes'))

    expect(rows).toEqual([{ body: 'ancienne', author: 'inconnu' }])
    const applied = await upgraded.read((tx) =>
      tx.all<{ id: string }>('SELECT id FROM schema_migrations ORDER BY id').map((row) => row.id),
    )
    expect(applied).toEqual(['0001_create_notes', '0002_add_note_author'])
  })

  it("n'applique chaque migration qu'une fois", async () => {
    const store = new MemoryBlobStore()
    const database = openDatabase(store, { migrations: [createNotes, addAuthor] })

    await database.write(addNote('a'))
    await database.write(addNote('b'))
    await openDatabase(store, { migrations: [createNotes, addAuthor] }).write(addNote('c'))

    expect(await database.read(listNotes)).toEqual(['a', 'b', 'c'])
  })

  it('refuse une migration modifiée après application', async () => {
    const store = new MemoryBlobStore()
    await openDatabase(store).write(addNote('a'))

    const edited: Migration = { ...createNotes, sql: `${createNotes.sql} -- retouchée` }
    const database = openDatabase(store, { migrations: [edited] })

    await expect(database.read(listNotes)).rejects.toBeInstanceOf(MigrationError)
    await expect(database.write(addNote('b'))).rejects.toBeInstanceOf(MigrationError)
  })

  it('tolère un simple changement de mise en page du SQL', async () => {
    const store = new MemoryBlobStore()
    await openDatabase(store).write(addNote('a'))

    const reformatted: Migration = {
      ...createNotes,
      sql: `\n  CREATE TABLE notes (id INTEGER PRIMARY KEY,\n    body TEXT NOT NULL) STRICT;\n`,
    }

    expect(await openDatabase(store, { migrations: [reformatted] }).read(listNotes)).toEqual(['a'])
  })

  it('refuse de tourner sur une base plus récente que le code', async () => {
    const store = new MemoryBlobStore()
    await openDatabase(store, { migrations: [createNotes, addAuthor] }).write(addNote('a'))

    // Retour à une ancienne version du code, qui ne connaît pas la seconde migration.
    await expect(openDatabase(store).read(listNotes)).rejects.toBeInstanceOf(MigrationError)
  })

  it('refuse une liste de migrations mal formée', () => {
    const store = new MemoryBlobStore()

    expect(() => openDatabase(store, { migrations: [addAuthor, createNotes] })).toThrow(
      MigrationError,
    )
    expect(() => openDatabase(store, { migrations: [createNotes, createNotes] })).toThrow(
      MigrationError,
    )
    expect(() =>
      openDatabase(store, { migrations: [{ id: 'sans-numero', sql: 'SELECT 1;' }] }),
    ).toThrow(MigrationError)
  })
})

describe('copies quotidiennes', () => {
  const backups = { prefix: 'backups/test/', keep: 3 }

  function openWithClock(store: MemoryBlobStore, clock: { now: Date }) {
    return openDatabase(store, { backups, now: () => clock.now })
  }

  it('copie la base à la première écriture de chaque jour (heure de Paris)', async () => {
    const store = new MemoryBlobStore()
    const clock = { now: new Date('2026-11-17T09:00:00Z') }
    const database = openWithClock(store, clock)

    await database.write(addNote('matin'))
    await database.write(addNote('midi'))
    expect(await database.listBackups()).toEqual(['backups/test/2026-11-17.sqlite'])

    // 23 h 30 UTC : il est déjà le lendemain à Paris.
    clock.now = new Date('2026-11-17T23:30:00Z')
    await database.write(addNote('nuit'))
    expect(await database.listBackups()).toEqual([
      'backups/test/2026-11-17.sqlite',
      'backups/test/2026-11-18.sqlite',
    ])
  })

  it('enregistre une copie complète et lisible', async () => {
    const store = new MemoryBlobStore()
    const database = openWithClock(store, { now: new Date('2026-11-17T09:00:00Z') })
    await database.write(addNote('à sauvegarder'))

    const sqlite = await loadSqlite()
    const copy = new sqlite.Database(store.peek('backups/test/2026-11-17.sqlite'))
    expect(copy.exec('SELECT body FROM notes')[0]?.values).toEqual([['à sauvegarder']])
  })

  it('ne garde que les copies les plus récentes', async () => {
    const store = new MemoryBlobStore()
    const clock = { now: new Date('2026-11-01T09:00:00Z') }
    const database = openWithClock(store, clock)

    for (let day = 1; day <= 5; day += 1) {
      clock.now = new Date(`2026-11-0${day}T09:00:00Z`)
      await database.write(addNote(`jour ${day}`))
    }

    expect(await database.listBackups()).toEqual([
      'backups/test/2026-11-03.sqlite',
      'backups/test/2026-11-04.sqlite',
      'backups/test/2026-11-05.sqlite',
    ])
  })

  it("n'empêche pas l'écriture quand la copie échoue", async () => {
    const store = new MemoryBlobStore()
    const database = openWithClock(store, { now: new Date('2026-11-17T09:00:00Z') })
    const silenced = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    store.beforeWrite = (key) => {
      if (key.startsWith(backups.prefix)) throw new Error('copie impossible')
    }

    await database.write(addNote('enregistrée malgré tout'))

    expect(await database.read(listNotes)).toEqual(['enregistrée malgré tout'])
    expect(await database.listBackups()).toEqual([])
    expect(silenced).toHaveBeenCalled()
    silenced.mockRestore()
  })

  it('ne copie rien quand les copies sont désactivées', async () => {
    const store = new MemoryBlobStore()
    const database = openDatabase(store, { backups: null })

    await database.write(addNote('a'))

    expect(store.keys()).toEqual([KEY])
    expect(await database.listBackups()).toEqual([])
  })
})
