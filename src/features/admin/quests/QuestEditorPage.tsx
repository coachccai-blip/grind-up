import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import {
  isAutoCorrected,
  QUEST_CATEGORIES,
  QUEST_DIFFICULTIES,
  QUEST_FORMATS,
  SUGGESTED_FORMAT,
  type QuestCategory,
  type QuestDifficulty,
  type QuestFormat,
} from '../../../../shared/rules/quests'
import type { GameSettings } from '../../../../shared/rules/settings'
import type { LibraryExercise } from '../../../../shared/schemas/library'
import { QUEST_TITLE_MAX, type AdminQuestDetail } from '../../../../shared/schemas/quests'
import { RICH_TEXT_MAX_LENGTH } from '../../../../shared/rules/rich-text'
import { ApiError, errorFields, errorMessage } from '../../../lib/api'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { Checkbox } from '../../../ui/Choice'
import { EmptyState } from '../../../ui/EmptyState'
import { Field, TextArea } from '../../../ui/Field'
import { Notice } from '../../../ui/Notice'
import { OptionGroup } from '../../../ui/OptionGroup'
import { RichText } from '../../../ui/RichText'
import { TextLink } from '../../../ui/TextLink'
import { formatXp } from '../../quests/QuestChips'
import { useSettings } from '../settings/settings-api'
import { useStudents } from '../students-api'
import { AssigneePicker } from './AssigneePicker'
import { ItemsEditor } from './ItemsEditor'
import {
  checkForm,
  emptyForm,
  formFromExercise,
  formFromQuest,
  initialItems,
  toRequest,
  type FormItem,
  type QuestForm,
} from './quest-form'
import styles from './QuestEditorPage.module.css'
import { ImagePicker } from './ImagePicker'
import { useLibraryExercise } from './library-api'
import { useAdminQuest, useSaveQuest, type ImageChange } from './quests-api'

/**
 * Création d'une quête, ou modification d'une quête existante. Une quête neuve
 * peut partir d'un exercice de la bibliothèque : /admin/quetes/nouvelle?modele=…
 */
export function QuestEditorPage() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const exerciseId = id === undefined ? search.get('modele') : null
  const existing = useAdminQuest(id)
  const exercise = useLibraryExercise(exerciseId)
  // Le barème et les valeurs proposées pour une quête viennent des paramètres.
  const settings = useSettings()

  if (settings.isError) return <Notice tone="error">{errorMessage(settings.error)}</Notice>
  if (!settings.data) return <p>Chargement de la quête…</p>
  if (id === undefined && exerciseId === null) {
    return <QuestEditor key="new" quest={null} exercise={null} settings={settings.data} />
  }
  if (id === undefined) {
    if (exercise.isPending) return <p>Chargement de l’exercice…</p>
    if (!exercise.data) {
      const missing = exercise.error instanceof ApiError && exercise.error.status === 404
      return missing ? (
        <EmptyState emoji="🧩" title="Exercice introuvable" pageTitle>
          <p>
            <TextLink to="/admin/quetes/bibliotheque">Retour à la bibliothèque</TextLink>
          </p>
        </EmptyState>
      ) : (
        <Notice tone="error">{errorMessage(exercise.error)}</Notice>
      )
    }
    return (
      <QuestEditor
        key={`modele-${exercise.data.id}`}
        quest={null}
        exercise={exercise.data}
        settings={settings.data}
      />
    )
  }
  if (existing.isPending) return <p>Chargement de la quête…</p>
  if (!existing.data) {
    const missing = existing.error instanceof ApiError && existing.error.status === 404
    return missing ? (
      <EmptyState emoji="🧩" title="Quête introuvable" pageTitle>
        <p>
          <TextLink to="/admin/quetes">Retour aux quêtes</TextLink>
        </p>
      </EmptyState>
    ) : (
      <Notice tone="error">{errorMessage(existing.error)}</Notice>
    )
  }
  return (
    <QuestEditor
      key={existing.data.id}
      quest={existing.data}
      exercise={null}
      settings={settings.data}
    />
  )
}

const hasContent = (items: readonly FormItem[]) =>
  items.some(
    (item) =>
      item.prompt.trim() !== '' ||
      item.answersText.trim() !== '' ||
      item.explanation.trim() !== '' ||
      item.choices.some((choice) => choice.trim() !== ''),
  )

interface QuestEditorProps {
  quest: AdminQuestDetail | null
  /** Exercice de la bibliothèque dont une quête neuve reprend le contenu. */
  exercise: LibraryExercise | null
  settings: GameSettings
}

function QuestEditor({ quest, exercise, settings }: QuestEditorProps) {
  const navigate = useNavigate()
  const students = useStudents()
  const save = useSaveQuest(quest?.id)

  const [form, setForm] = useState<QuestForm>(() =>
    quest
      ? formFromQuest(quest, settings)
      : exercise
        ? formFromExercise(exercise, settings)
        : emptyForm(settings),
  )
  // Le contenu saisi pour un format est gardé de côté : revenir à ce format le retrouve.
  const [setAside, setSetAside] = useState<Partial<Record<QuestFormat, FormItem[]>>>({})
  // Le format d'une quête existante ou d'un exercice est déjà choisi : il ne suit plus la catégorie.
  const [formatChosen, setFormatChosen] = useState(quest !== null || exercise !== null)
  const [image, setImage] = useState<ImageChange>({ kind: 'keep' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submissions, setSubmissions] = useState(0)
  const formElement = useRef<HTMLFormElement>(null)

  const isPublished = quest !== null && quest.state !== 'draft'
  const isArchived = quest?.state === 'archived'
  const locked = quest?.locked === true
  const auto = isAutoCorrected(form.format)
  const set = (changes: Partial<QuestForm>) => setForm((current) => ({ ...current, ...changes }))
  const fieldErrors = { ...errorFields(save.error), ...errors }
  const errorCount = Object.keys(fieldErrors).length

  // Après un envoi refusé, le premier champ à corriger est amené à l'écran.
  useEffect(() => {
    if (submissions === 0) return
    const invalid = formElement.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"], [data-invalid]',
    )
    invalid?.scrollIntoView({ block: 'center' })
    invalid?.focus({ preventScroll: true })
  }, [submissions])

  const chooseFormat = (format: QuestFormat) => {
    if (format === form.format) return
    setSetAside({ ...setAside, [form.format]: form.items })
    set({ format, items: setAside[format] ?? initialItems(format) })
  }

  const chooseCategory = (category: QuestCategory) => {
    set({ category })
    // Tant que l'admin n'a ni choisi de format ni rien saisi, le format suit la catégorie.
    if (!formatChosen && !hasContent(form.items)) chooseFormat(SUGGESTED_FORMAT[category])
  }

  const chooseDifficulty = (difficulty: QuestDifficulty) => {
    // La récompense suit la difficulté tant que l'admin n'a pas saisi la sienne.
    const untouched = form.rewardXp === String(settings.rewards[form.difficulty])
    set({
      difficulty,
      ...(untouched ? { rewardXp: String(settings.rewards[difficulty]) } : {}),
    })
  }

  const submit = (publish: boolean) => {
    const request = toRequest(form, publish)
    const problems = checkForm(form, request, {
      complete: publish || isPublished,
      checkDeadline: !isPublished || request.deadlineAt !== quest.deadlineAt,
    })
    setErrors(problems)
    if (Object.keys(problems).length > 0) {
      setSubmissions((count) => count + 1)
      return
    }
    save.mutate(
      { request, image },
      {
        onSuccess: ({ quest: saved, imageError }) =>
          void navigate(`/admin/quetes/${saved.id}`, {
            state: {
              notice: isPublished
                ? 'Modifications enregistrées.'
                : publish
                  ? 'Quête publiée.'
                  : 'Brouillon enregistré.',
              warning: imageError
                ? `L’image n’a pas pu être enregistrée. ${imageError}`
                : undefined,
            },
          }),
        onError: () => setSubmissions((count) => count + 1),
      },
    )
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit(!isPublished)
  }

  const activeStudents = (students.data ?? []).filter((student) => student.isActive)

  return (
    <form ref={formElement} className={styles.form} onSubmit={onSubmit} noValidate>
      <p>
        <TextLink
          to={
            quest
              ? `/admin/quetes/${quest.id}`
              : exercise
                ? '/admin/quetes/bibliotheque'
                : '/admin/quetes'
          }
        >
          {quest
            ? 'Retour à la quête'
            : exercise
              ? 'Retour à la bibliothèque'
              : 'Retour aux quêtes'}
        </TextLink>
      </p>
      <h1>{quest ? 'Modifier la quête' : 'Nouvelle quête'}</h1>

      {exercise && (
        <Notice tone="info">
          Cette quête reprend l’exercice «&nbsp;{exercise.title}&nbsp;» de la bibliothèque&nbsp;:
          rappel du cours, exemple expliqué, questions et correction détaillée de chacune. Tout
          reste modifiable. Choisissez les élèves en bas de la page, puis publiez la quête.
          <p className={styles.shortcut}>
            <Button variant="quiet" onClick={() => goToStudents(formElement.current)}>
              Aller au choix des élèves
            </Button>
          </p>
        </Notice>
      )}

      {isArchived && (
        <Notice tone="warning">Cette quête est archivée. Restaurez-la pour la modifier.</Notice>
      )}
      {locked && !isArchived && (
        <Notice tone="info">
          Un élève a déjà répondu à cette quête&nbsp;: seuls le titre, le rappel du cours,
          l’exemple, la consigne et la deadline peuvent encore changer.
        </Notice>
      )}

      <Card className={styles.section}>
        <h2>Type de quête</h2>
        <OptionGroup
          legend="Catégorie"
          value={form.category}
          onChange={chooseCategory}
          disabled={locked}
          options={QUEST_CATEGORIES.map(({ id, label, emoji }) => ({ value: id, label, emoji }))}
        />
        <OptionGroup
          legend="Format"
          layout="list"
          value={form.format}
          onChange={(format) => {
            setFormatChosen(true)
            chooseFormat(format)
          }}
          disabled={locked}
          options={QUEST_FORMATS.map(({ id, label, hint }) => ({ value: id, label, hint }))}
        />
      </Card>

      <Card className={styles.section}>
        <h2>Contenu</h2>
        <Field
          label="Titre"
          value={form.title}
          maxLength={QUEST_TITLE_MAX}
          onChange={(event) => set({ title: event.target.value })}
          hint={`${form.title.length} sur ${QUEST_TITLE_MAX} caractères. Les emojis sont acceptés.`}
          error={fieldErrors.title}
        />
        <LessonFields
          lesson={form.lesson}
          example={form.example}
          onChange={set}
          errors={fieldErrors}
        />
        <TextArea
          label="Consigne"
          rows={5}
          maxLength={RICH_TEXT_MAX_LENGTH}
          value={form.instructions}
          onChange={(event) => set({ instructions: event.target.value })}
          hint={
            'Mise en forme\u00A0: **gras**, un tiret en début de ligne pour une liste, une adresse https://… pour un lien.'
          }
          error={fieldErrors.instructions}
        />
        {form.instructions.trim() !== '' && (
          <details className={styles.preview}>
            <summary>Aperçu de la consigne</summary>
            <RichText text={form.instructions} />
          </details>
        )}
        <ImagePicker current={quest?.imageUrl ?? null} change={image} onChange={setImage} />

        {auto && (
          <>
            <ItemsEditor
              format={form.format}
              items={form.items}
              onChange={(items) => set({ items })}
              errors={fieldErrors}
              disabled={locked}
            />
            <div className={styles.pair}>
              <Field
                label="Seuil de réussite (en %)"
                inputMode="numeric"
                value={form.passThreshold}
                onChange={(event) => set({ passThreshold: event.target.value })}
                hint="Part de bonnes réponses à atteindre pour valider la quête."
                error={fieldErrors.passThreshold}
                disabled={locked}
              />
              <Field
                label="Tentatives"
                inputMode="numeric"
                value={form.maxAttempts}
                onChange={(event) => set({ maxAttempts: event.target.value })}
                hint="Nombre d’essais permis à chaque élève."
                error={fieldErrors.maxAttempts}
                disabled={locked}
              />
            </div>
          </>
        )}

        {form.format === 'declarative' && (
          <OptionGroup
            legend="Validation"
            layout="list"
            value={form.manualValidation ? 'manual' : 'immediate'}
            onChange={(mode) => set({ manualValidation: mode === 'manual' })}
            disabled={locked}
            options={[
              {
                value: 'immediate',
                label: 'Immédiate',
                hint: 'L’élève gagne son XP dès qu’il déclare avoir fini.',
              },
              {
                value: 'manual',
                label: 'Par vous',
                hint: 'Chaque réalisation attend votre validation.',
              },
            ]}
          />
        )}
        {form.format === 'free_text' && (
          <p className={styles.note}>Vous lirez et validerez chaque réponse.</p>
        )}
      </Card>

      <Card className={styles.section}>
        <h2>Récompense</h2>
        <OptionGroup
          legend="Difficulté"
          value={form.difficulty}
          onChange={chooseDifficulty}
          disabled={locked}
          options={QUEST_DIFFICULTIES.map(({ id, label, emoji }) => ({
            value: id,
            label,
            emoji,
            hint: formatXp(settings.rewards[id]),
          }))}
        />
        <Field
          label="Récompense (en XP)"
          inputMode="numeric"
          className={styles.short}
          value={form.rewardXp}
          onChange={(event) => set({ rewardXp: event.target.value })}
          hint="Pré-remplie selon la difficulté, modifiable."
          error={fieldErrors.rewardXp}
          disabled={locked}
        />
      </Card>

      <Card className={styles.section}>
        <h2>Deadline</h2>
        <Checkbox
          label="Fixer une deadline"
          hint={
            form.deadlineLocal === ''
              ? 'Sans deadline, la quête n’expire jamais et ne donne pas de bonus d’avance.'
              : undefined
          }
          checked={form.deadlineLocal !== ''}
          onChange={(event) =>
            set({ deadlineLocal: event.target.checked ? defaultDeadline() : '' })
          }
        />
        {form.deadlineLocal !== '' && (
          <Field
            label="Date et heure"
            type="datetime-local"
            className={styles.short}
            value={form.deadlineLocal}
            onChange={(event) => set({ deadlineLocal: event.target.value })}
            hint={
              'Heure de Paris. Une quête finie plus de 24\u00A0h avant rapporte le bonus d’avance.'
            }
            error={fieldErrors.deadlineAt}
          />
        )}
      </Card>

      {/* Une quête publiée reçoit de nouveaux élèves depuis sa fiche, pas depuis ce formulaire. */}
      {!isPublished && (
        <Card className={styles.section} data-section="students">
          <h2 tabIndex={-1}>Élèves</h2>
          {students.isError && <Notice tone="error">{errorMessage(students.error)}</Notice>}
          {students.isPending && <p>Chargement des élèves…</p>}
          {students.isSuccess && (
            <AssigneePicker
              students={activeStudents}
              all={form.assignAll}
              chosen={form.assignees}
              onChange={({ all, chosen }) => set({ assignAll: all, assignees: chosen })}
            />
          )}
        </Card>
      )}

      {errorCount > 0 && (
        <Notice tone="error">
          {errorCount > 1
            ? `${errorCount} points sont à corriger avant d’enregistrer.`
            : 'Un point est à corriger avant d’enregistrer.'}
        </Notice>
      )}
      {save.isError && Object.keys(errorFields(save.error)).length === 0 && (
        <Notice tone="error">{errorMessage(save.error)}</Notice>
      )}

      {!isArchived && (
        <div className={styles.actions}>
          {!isPublished && (
            <Button onClick={() => submit(false)} disabled={save.isPending}>
              Enregistrer le brouillon
            </Button>
          )}
          <Button type="submit" variant="primary" busy={save.isPending} busyLabel="Enregistrement…">
            {isPublished ? 'Enregistrer' : 'Publier la quête'}
          </Button>
        </div>
      )}
    </form>
  )
}

/**
 * Amène à l'écran le choix des élèves, tout en bas d'un formulaire que la
 * bibliothèque a rempli : il ne reste souvent que cela à faire avant de publier.
 */
function goToStudents(form: HTMLFormElement | null): void {
  const section = form?.querySelector<HTMLElement>('[data-section="students"]')
  section?.scrollIntoView({ block: 'start' })
  section?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
}

interface LessonFieldsProps {
  lesson: string
  example: string
  onChange: (changes: Pick<Partial<QuestForm>, 'lesson' | 'example'>) => void
  errors: Record<string, string>
}

const rowsFor = (text: string) => Math.min(14, Math.max(4, text.split('\n').length + 1))

/**
 * Rappel du cours et exemple expliqué : ce que l'élève lit avant la consigne.
 * Facultatifs, donc repliés tant qu'ils sont vides.
 */
function LessonFields({ lesson, example, onChange, errors }: LessonFieldsProps) {
  // L'état de départ ne change plus ensuite : effacer le texte ne replie pas la zone en pleine saisie.
  const [startsOpen] = useState(lesson !== '' || example !== '')
  return (
    <details className={styles.preview} open={startsOpen}>
      <summary>Rappel du cours et exemple expliqué</summary>
      <div className={styles.lesson}>
        <TextArea
          label="Rappel du cours"
          rows={rowsFor(lesson)}
          maxLength={RICH_TEXT_MAX_LENGTH}
          value={lesson}
          onChange={(event) => onChange({ lesson: event.target.value })}
          hint="Facultatif. Les définitions et les formules utiles, que l’élève lit avant la consigne."
          error={errors.lesson}
        />
        <TextArea
          label="Exemple expliqué"
          rows={rowsFor(example)}
          maxLength={RICH_TEXT_MAX_LENGTH}
          value={example}
          onChange={(event) => onChange({ example: event.target.value })}
          hint="Facultatif. Une question du même genre, résolue pas à pas. Même mise en forme que la consigne."
          error={errors.example}
        />
        {(lesson.trim() !== '' || example.trim() !== '') && (
          <details className={styles.lessonPreview}>
            <summary>Aperçu du rappel et de l’exemple</summary>
            {lesson.trim() !== '' && (
              <>
                <h3>Rappel du cours</h3>
                <RichText text={lesson} />
              </>
            )}
            {example.trim() !== '' && (
              <>
                <h3>Exemple expliqué</h3>
                <RichText text={example} />
              </>
            )}
          </details>
        )}
      </div>
    </details>
  )
}

/** Deadline proposée quand l'admin coche la case : dans une semaine, à 18 h, heure de Paris. */
function defaultDeadline(): string {
  const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(inAWeek)
  return `${day}T18:00`
}
