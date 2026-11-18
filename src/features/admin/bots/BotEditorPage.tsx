import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { AVATARS } from '../../../../shared/rules/avatars'
import {
  BOT_MISSIONS_MAX,
  BOT_MISSIONS_MIN,
  BOT_MODES,
  BOT_PSEUDOS,
  BOT_TARGETS,
  DEFAULT_BOT_MISSIONS,
  DEFAULT_DIFFICULTY_MIX,
  type BotMode,
  type BotTarget,
} from '../../../../shared/rules/bots'
import { QUEST_DIFFICULTIES, type QuestDifficulty } from '../../../../shared/rules/quests'
import { createBotRequestSchema } from '../../../../shared/schemas/leaderboard'
import { errorFields, errorMessage } from '../../../lib/api'
import { AvatarChoice } from '../../../ui/AvatarChoice'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { Checkbox } from '../../../ui/Choice'
import { EmptyState } from '../../../ui/EmptyState'
import { Field } from '../../../ui/Field'
import { Notice } from '../../../ui/Notice'
import { OptionGroup } from '../../../ui/OptionGroup'
import { formatXp } from '../../quests/QuestChips'
import { useBots, useCreateBot, useUpdateBot, type AdminBot } from './bots-api'
import styles from './BotEditorPage.module.css'

const pick = <Value,>(values: readonly Value[]): Value =>
  values[Math.floor(Math.random() * values.length)]!

/** Création d'un bot, ou modification de ses réglages. */
export function BotEditorPage() {
  const { id } = useParams()
  const bots = useBots()

  if (id === undefined) return <BotEditor key="new" bot={null} taken={pseudosOf(bots.data)} />
  if (bots.isPending) return <p>Chargement du bot…</p>
  const bot = bots.data?.find((candidate) => candidate.id === id)
  if (!bot) {
    return bots.isError ? (
      <Notice tone="error">{errorMessage(bots.error)}</Notice>
    ) : (
      <EmptyState emoji="🧩" title="Bot introuvable" pageTitle>
        <p>
          <Link to="/admin/bots">Retour aux bots</Link>
        </p>
      </EmptyState>
    )
  }
  return <BotEditor key={bot.id} bot={bot} taken={[]} />
}

const pseudosOf = (bots: readonly AdminBot[] | undefined) =>
  (bots ?? []).map((bot) => bot.pseudo.toLocaleLowerCase('fr-FR'))

interface BotEditorProps {
  bot: AdminBot | null
  /** Pseudos des bots existants, pour ne pas les proposer au hasard. */
  taken: readonly string[]
}

function BotEditor({ bot, taken }: BotEditorProps) {
  const navigate = useNavigate()
  const create = useCreateBot()
  const update = useUpdateBot(bot?.id ?? '')
  const save = bot ? update : create

  const [pseudo, setPseudo] = useState(bot?.pseudo ?? '')
  const [avatar, setAvatar] = useState(() => bot?.avatar ?? pick(AVATARS).id)
  const [mode, setMode] = useState<BotMode>(bot?.mode ?? 'regular')
  const [missionsPerWeek, setMissionsPerWeek] = useState(
    String(bot?.missionsPerWeek ?? DEFAULT_BOT_MISSIONS),
  )
  const [target, setTarget] = useState<BotTarget>(bot?.target ?? 'middle')
  const [mix, setMix] = useState<Record<QuestDifficulty, string>>(() => {
    const values = bot?.difficultyMix ?? DEFAULT_DIFFICULTY_MIX
    return {
      easy: String(values.easy),
      medium: String(values.medium),
      hard: String(values.hard),
      epic: String(values.epic),
    }
  })
  const [capped, setCapped] = useState(bot?.capped ?? true)
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const errors = { ...errorFields(save.error), ...localErrors }

  const drawIdentity = () => {
    const free = BOT_PSEUDOS.filter((name) => !taken.includes(name.toLocaleLowerCase('fr-FR')))
    setPseudo(pick(free.length > 0 ? free : BOT_PSEUDOS))
    setAvatar(pick(AVATARS).id)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const toNumber = (text: string) => (text.trim() === '' ? Number.NaN : Number(text.trim()))
    const parsed = createBotRequestSchema.safeParse({
      pseudo,
      avatar,
      mode,
      missionsPerWeek: toNumber(missionsPerWeek),
      target,
      difficultyMix: {
        easy: toNumber(mix.easy),
        medium: toNumber(mix.medium),
        hard: toNumber(mix.hard),
        epic: toNumber(mix.epic),
      },
      capped,
    })
    if (!parsed.success) {
      const problems: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? '_')
        problems[field] ??=
          field === 'difficultyMix'
            ? 'Donnez à chaque difficulté un poids de 0 à 100, dont un au moins au-dessus de zéro.'
            : field === 'missionsPerWeek'
              ? `De ${BOT_MISSIONS_MIN} à ${BOT_MISSIONS_MAX} missions par semaine.`
              : issue.message
      }
      setLocalErrors(problems)
      return
    }
    setLocalErrors({})
    const onSuccess = () =>
      void navigate('/admin/bots', {
        state: {
          notice: bot ? `${parsed.data.pseudo} est mis à jour.` : `${parsed.data.pseudo} est créé.`,
        },
      })
    if (bot) update.mutate(parsed.data, { onSuccess })
    else create.mutate(parsed.data, { onSuccess })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <p>
        <Link to="/admin/bots">Retour aux bots</Link>
      </p>
      <h1>{bot ? `Modifier ${bot.pseudo}` : 'Nouveau bot'}</h1>

      <Card className={styles.section}>
        <h2>Identité</h2>
        <Field
          label="Pseudo"
          value={pseudo}
          onChange={(event) => setPseudo(event.target.value)}
          error={errors.pseudo}
          autoComplete="off"
        />
        <AvatarChoice legend="Avatar du bot" value={avatar} onChange={setAvatar} />
        {errors.avatar && <Notice tone="error">{errors.avatar}</Notice>}
        <div>
          <Button onClick={drawIdentity}>Tirer un pseudo et un avatar au hasard</Button>
        </div>
      </Card>

      <Card className={styles.section}>
        <h2>Rythme</h2>
        <OptionGroup
          legend="Mode"
          layout="list"
          value={mode}
          onChange={setMode}
          options={BOT_MODES.map(({ id: value, label, hint }) => ({ value, label, hint }))}
        />
        {mode === 'regular' ? (
          <Field
            label="Missions par semaine"
            inputMode="numeric"
            className={styles.short}
            value={missionsPerWeek}
            onChange={(event) => setMissionsPerWeek(event.target.value)}
            hint={`De ${BOT_MISSIONS_MIN} à ${BOT_MISSIONS_MAX}. Leurs jours et leurs heures sont tirés au sort chaque semaine, entre 8 h et 21 h.`}
            error={errors.missionsPerWeek}
          />
        ) : (
          <OptionGroup
            legend="Position visée"
            layout="list"
            value={target}
            onChange={setTarget}
            hint={
              'Réévaluée au plus une fois par heure\u00A0; le bot avance d’une mission à la fois.'
            }
            options={BOT_TARGETS.map(({ id: value, label }) => ({ value, label }))}
          />
        )}
        <Checkbox
          label="Ne dépasse jamais le premier élève réel"
          hint="Le bot reste au moins une mission derrière le meilleur élève, sur chaque période."
          checked={capped}
          onChange={(event) => setCapped(event.target.checked)}
        />
      </Card>

      <Card className={styles.section}>
        <h2>XP par mission</h2>
        <p className={styles.note}>
          L’XP de chaque mission est tirée au sort dans le barème des difficultés. Plus le poids
          d’une difficulté est grand, plus elle sort souvent.
        </p>
        <div className={styles.mix}>
          {QUEST_DIFFICULTIES.map((difficulty) => (
            <Field
              key={difficulty.id}
              label={`${difficulty.label} (${formatXp(difficulty.defaultReward)})`}
              inputMode="numeric"
              value={mix[difficulty.id]}
              onChange={(event) => setMix({ ...mix, [difficulty.id]: event.target.value })}
            />
          ))}
        </div>
        {errors.difficultyMix && <Notice tone="error">{errors.difficultyMix}</Notice>}
      </Card>

      {save.isError && Object.keys(errorFields(save.error)).length === 0 && (
        <Notice tone="error">{errorMessage(save.error)}</Notice>
      )}
      <div className={styles.actions}>
        <Button type="submit" variant="primary" busy={save.isPending} busyLabel="Enregistrement…">
          {bot ? 'Enregistrer' : 'Créer le bot'}
        </Button>
      </div>
    </form>
  )
}
