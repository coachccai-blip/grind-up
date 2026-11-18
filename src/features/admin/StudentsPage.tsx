import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { pseudoKey } from '../../../shared/rules/pseudo'
import type { AdminStudent } from '../../../shared/schemas/admin'
import { formatRelative } from '../../lib/dates'
import { errorMessage } from '../../lib/api'
import { Avatar } from '../../ui/Avatar'
import { Field } from '../../ui/Field'
import { Identifier } from '../../ui/Identifier'
import { Notice } from '../../ui/Notice'
import { InviteCard } from './AdminPages'
import { StatusChip } from './StatusChip'
import styles from './StudentsPage.module.css'
import { useStudents } from './students-api'

/** Un élève correspond à la recherche par son pseudo ou par son identifiant. */
function matches(student: AdminStudent, search: string): boolean {
  const text = search.trim()
  if (text === '') return true
  const compactId = (value: string) => value.replace(/[\s-]/g, '').toUpperCase()
  return (
    pseudoKey(student.pseudo).includes(pseudoKey(text)) ||
    compactId(student.publicId).includes(compactId(text))
  )
}

/** Liste des élèves, avec recherche par pseudo ou identifiant. */
export function StudentsPage() {
  const students = useStudents()
  const [search, setSearch] = useState('')
  const notice = (useLocation().state as { notice?: string } | null)?.notice

  const all = students.data ?? []
  const shown = all.filter((student) => matches(student, search))

  return (
    <>
      <h1>Élèves</h1>
      {notice && <Notice tone="success">{notice}</Notice>}
      {students.isError && <Notice tone="error">{errorMessage(students.error)}</Notice>}
      {students.isPending && <p>Chargement des élèves…</p>}

      {students.isSuccess && all.length === 0 && <InviteCard />}

      {all.length > 0 && (
        <>
          <Field
            label="Rechercher un élève"
            type="search"
            placeholder="Pseudo ou identifiant"
            autoComplete="off"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <p className={styles.count} role="status">
            {shown.length === all.length
              ? `${all.length} élève${all.length > 1 ? 's' : ''}`
              : `${shown.length} sur ${all.length} élèves`}
          </p>
          <ul className={styles.list}>
            {shown.map((student) => (
              <li key={student.id}>
                <Link to={`/admin/eleves/${student.id}`} className={styles.row}>
                  <span className={styles.avatar}>
                    <Avatar avatar={student.avatar} decorative />
                  </span>
                  <span className={styles.pseudo}>{student.pseudo}</span>
                  <span className={styles.identifier}>
                    <Identifier value={student.publicId} />
                  </span>
                  {/* Seule l'exception est signalée : un compte actif n'a pas d'étiquette. */}
                  <span className={styles.status}>
                    {!student.isActive && <StatusChip active={false} />}
                  </span>
                  <span className={styles.activity}>
                    {student.lastActiveAt
                      ? `Dernière activité\u00A0: ${formatRelative(student.lastActiveAt)}`
                      : 'Aucune activité'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {shown.length === 0 && <p>Aucun élève ne correspond à cette recherche.</p>}
        </>
      )}
    </>
  )
}
