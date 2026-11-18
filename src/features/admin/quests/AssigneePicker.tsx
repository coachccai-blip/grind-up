import { useState } from 'react'
import type { AdminStudent } from '../../../../shared/schemas/admin'
import { Checkbox, Radio } from '../../../ui/Choice'
import { Field } from '../../../ui/Field'
import { studentMatches } from '../student-search'
import styles from './AssigneePicker.module.css'

interface AssigneePickerProps {
  /** Élèves actifs, les seuls à qui une quête peut être donnée. */
  students: readonly AdminStudent[]
  all: boolean
  chosen: readonly string[]
  onChange: (value: { all: boolean; chosen: string[] }) => void
  /** Élèves qui ont déjà la quête : ils restent cochés, une quête publiée ne se retire pas. */
  alreadyAssigned?: ReadonlySet<string>
}

/** Choix des élèves d'une quête : tous, ou une sélection par cases à cocher, avec recherche. */
export function AssigneePicker({
  students,
  all,
  chosen,
  onChange,
  alreadyAssigned = new Set(),
}: AssigneePickerProps) {
  const [search, setSearch] = useState('')
  const remaining = students.filter((student) => !alreadyAssigned.has(student.id))
  const shown = students.filter((student) => studentMatches(student, search))
  const count = all ? remaining.length : chosen.length

  const toggle = (id: string) =>
    onChange({
      all: false,
      chosen: chosen.includes(id) ? chosen.filter((other) => other !== id) : [...chosen, id],
    })

  if (students.length === 0) {
    return (
      <p className={styles.note}>
        Aucun élève n’est encore inscrit. Vous pourrez donner cette quête plus tard, depuis sa
        fiche.
      </p>
    )
  }

  return (
    <div className={styles.picker}>
      <div role="radiogroup" aria-label="Élèves concernés">
        <Radio
          name="assignees"
          label={alreadyAssigned.size > 0 ? 'Tous les autres élèves' : 'Tous les élèves'}
          hint={`${remaining.length} élève${remaining.length > 1 ? 's' : ''} aujourd’hui. Ceux qui s’inscriront ensuite ne la recevront pas d’office.`}
          checked={all}
          onChange={() => onChange({ all: true, chosen: [...chosen] })}
        />
        <Radio
          name="assignees"
          label="Choisir les élèves"
          checked={!all}
          onChange={() => onChange({ all: false, chosen: [...chosen] })}
        />
      </div>

      {!all && (
        <>
          <Field
            label="Rechercher un élève"
            type="search"
            placeholder="Pseudo ou identifiant"
            autoComplete="off"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <ul className={styles.list}>
            {shown.map((student) => {
              const already = alreadyAssigned.has(student.id)
              return (
                <li key={student.id}>
                  <Checkbox
                    label={student.pseudo}
                    hint={already ? `${student.publicId} · a déjà cette quête` : student.publicId}
                    checked={already || chosen.includes(student.id)}
                    disabled={already}
                    onChange={() => toggle(student.id)}
                  />
                </li>
              )
            })}
          </ul>
          {shown.length === 0 && <p className={styles.note}>Aucun élève ne correspond.</p>}
        </>
      )}
      <p className={styles.note} role="status">
        {count === 0
          ? 'Aucun élève choisi.'
          : `${count} élève${count > 1 ? 's' : ''} choisi${count > 1 ? 's' : ''}.`}
      </p>
    </div>
  )
}
