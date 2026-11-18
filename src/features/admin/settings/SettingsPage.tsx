import { useEffect, useRef, useState, type FormEvent } from 'react'
import { QUEST_DIFFICULTIES, type QuestDifficulty } from '../../../../shared/rules/quests'
import { DEFAULT_GAME_SETTINGS, type GameSettings } from '../../../../shared/rules/settings'
import { updateSettingsRequestSchema } from '../../../../shared/schemas/settings'
import { errorFields, errorMessage } from '../../../lib/api'
import { Button, ButtonAnchor } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { Checkbox } from '../../../ui/Choice'
import { Field } from '../../../ui/Field'
import { Notice } from '../../../ui/Notice'
import { InstallCard } from '../../install/InstallCard'
import { useSettings, useUpdateSettings } from './settings-api'
import styles from './SettingsPage.module.css'

/**
 * Paramètres de l'admin : barème d'XP, bonus, valeurs proposées pour une
 * nouvelle quête, étiquette « Bot » côté élève, export des données.
 */
export function SettingsPage() {
  const settings = useSettings()

  return (
    <>
      <h1>Paramètres</h1>
      {settings.isError && <Notice tone="error">{errorMessage(settings.error)}</Notice>}
      {settings.isPending && <p>Chargement des paramètres…</p>}
      {settings.data && <SettingsEditor settings={settings.data} />}
      <ExportCard />
      <InstallCard audience="admin" />
    </>
  )
}

/** Les nombres sont gardés tels que l'admin les saisit ; ils ne sont convertis qu'à l'envoi. */
interface SettingsForm {
  rewards: Record<QuestDifficulty, string>
  earlyBonusPercent: string
  flawlessBonusPercent: string
  latePercent: string
  defaultPassThreshold: string
  defaultMaxAttempts: string
  showBotLabel: boolean
}

function toForm(settings: GameSettings): SettingsForm {
  return {
    rewards: {
      easy: String(settings.rewards.easy),
      medium: String(settings.rewards.medium),
      hard: String(settings.rewards.hard),
      epic: String(settings.rewards.epic),
    },
    earlyBonusPercent: String(settings.earlyBonusPercent),
    flawlessBonusPercent: String(settings.flawlessBonusPercent),
    latePercent: String(settings.latePercent),
    defaultPassThreshold: String(settings.defaultPassThreshold),
    defaultMaxAttempts: String(settings.defaultMaxAttempts),
    showBotLabel: settings.showBotLabel,
  }
}

const toNumber = (text: string) => (text.trim() === '' ? Number.NaN : Number(text.trim()))

function SettingsEditor({ settings }: { settings: GameSettings }) {
  const update = useUpdateSettings()
  const [form, setForm] = useState<SettingsForm>(() => toForm(settings))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<'saved' | 'reset' | null>(null)
  const [refusals, setRefusals] = useState(0)
  const formElement = useRef<HTMLFormElement>(null)
  const fieldErrors = { ...errorFields(update.error), ...errors }

  const set = (changes: Partial<SettingsForm>) => {
    setForm((current) => ({ ...current, ...changes }))
    setNotice(null)
  }

  // Après un envoi refusé, le premier champ à corriger est amené à l'écran.
  useEffect(() => {
    if (refusals === 0) return
    const invalid = formElement.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    invalid?.scrollIntoView({ block: 'center' })
    invalid?.focus({ preventScroll: true })
  }, [refusals])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = updateSettingsRequestSchema.safeParse({
      rewards: {
        easy: toNumber(form.rewards.easy),
        medium: toNumber(form.rewards.medium),
        hard: toNumber(form.rewards.hard),
        epic: toNumber(form.rewards.epic),
      },
      earlyBonusPercent: toNumber(form.earlyBonusPercent),
      flawlessBonusPercent: toNumber(form.flawlessBonusPercent),
      latePercent: toNumber(form.latePercent),
      defaultPassThreshold: toNumber(form.defaultPassThreshold),
      defaultMaxAttempts: toNumber(form.defaultMaxAttempts),
      showBotLabel: form.showBotLabel,
    })
    if (!parsed.success) {
      const problems: Record<string, string> = {}
      for (const issue of parsed.error.issues) problems[issue.path.join('.')] ??= issue.message
      setErrors(problems)
      setNotice(null)
      setRefusals((count) => count + 1)
      return
    }
    setErrors({})
    update.mutate(parsed.data, {
      onSuccess: () => setNotice('saved'),
      onError: () => setRefusals((count) => count + 1),
    })
  }

  /** Remet le barème, les bonus et les valeurs des nouvelles quêtes à leurs valeurs d'origine. */
  const reset = () => {
    setForm({ ...toForm(DEFAULT_GAME_SETTINGS), showBotLabel: form.showBotLabel })
    setErrors({})
    setNotice('reset')
  }

  return (
    <form ref={formElement} className={styles.form} onSubmit={submit} noValidate>
      <Card className={styles.section}>
        <h2>Barème d’XP</h2>
        <p className={styles.note}>
          Récompense proposée à la création d’une quête, selon sa difficulté. Les bots y tirent
          aussi l’XP de leurs missions. Les quêtes déjà créées gardent leur récompense.
        </p>
        <div className={styles.rewards}>
          {QUEST_DIFFICULTIES.map((difficulty) => (
            <Field
              key={difficulty.id}
              label={`${difficulty.label} (en XP)`}
              inputMode="numeric"
              value={form.rewards[difficulty.id]}
              onChange={(event) =>
                set({ rewards: { ...form.rewards, [difficulty.id]: event.target.value } })
              }
              error={fieldErrors[`rewards.${difficulty.id}`]}
            />
          ))}
        </div>
      </Card>

      <Card className={styles.section}>
        <h2>Bonus</h2>
        <p className={styles.note}>
          Ils s’appliquent aux quêtes validées à partir de maintenant&nbsp;: l’XP déjà gagnée ne
          change pas.
        </p>
        <div className={styles.triple}>
          <Field
            label="Bonus d’avance (en %)"
            inputMode="numeric"
            value={form.earlyBonusPercent}
            onChange={(event) => set({ earlyBonusPercent: event.target.value })}
            hint={'Pour une quête validée ou soumise plus de 24\u00A0h avant sa deadline.'}
            error={fieldErrors.earlyBonusPercent}
          />
          <Field
            label="Bonus sans faute (en %)"
            inputMode="numeric"
            value={form.flawlessBonusPercent}
            onChange={(event) => set({ flawlessBonusPercent: event.target.value })}
            hint={
              'Pour une quête corrigée automatiquement, réussie à 100\u00A0% dès la première tentative.'
            }
            error={fieldErrors.flawlessBonusPercent}
          />
          <Field
            label="Quête rendue en retard (en %)"
            inputMode="numeric"
            value={form.latePercent}
            onChange={(event) => set({ latePercent: event.target.value })}
            hint="Part de sa récompense que garde une quête rouverte après sa deadline."
            error={fieldErrors.latePercent}
          />
        </div>
      </Card>

      <Card className={styles.section}>
        <h2>Nouvelles quêtes</h2>
        <p className={styles.note}>
          Valeurs proposées à la création d’une quête corrigée automatiquement. Chaque quête garde
          ensuite les siennes.
        </p>
        <div className={styles.pair}>
          <Field
            label="Seuil de réussite (en %)"
            inputMode="numeric"
            value={form.defaultPassThreshold}
            onChange={(event) => set({ defaultPassThreshold: event.target.value })}
            hint="Part de bonnes réponses à atteindre pour valider la quête."
            error={fieldErrors.defaultPassThreshold}
          />
          <Field
            label="Tentatives"
            inputMode="numeric"
            value={form.defaultMaxAttempts}
            onChange={(event) => set({ defaultMaxAttempts: event.target.value })}
            hint="Nombre d’essais permis à chaque élève."
            error={fieldErrors.defaultMaxAttempts}
          />
        </div>
      </Card>

      <Card className={styles.section}>
        <h2>Leaderboard</h2>
        <Checkbox
          label="Montrer l’étiquette « Bot » aux élèves"
          hint="Sans elle, rien ne distingue un bot d’un élève dans leur leaderboard."
          checked={form.showBotLabel}
          onChange={(event) => set({ showBotLabel: event.target.checked })}
        />
      </Card>

      {notice === 'saved' && <Notice tone="success">Paramètres enregistrés.</Notice>}
      {notice === 'reset' && (
        <Notice tone="info">
          Le barème, les bonus et les valeurs des nouvelles quêtes sont revenus à leurs valeurs
          d’origine. Enregistrez pour les appliquer.
        </Notice>
      )}
      {Object.keys(fieldErrors).length > 0 && (
        <Notice tone="error">
          {Object.keys(fieldErrors).length > 1
            ? `${Object.keys(fieldErrors).length} valeurs sont à corriger avant d’enregistrer.`
            : 'Une valeur est à corriger avant d’enregistrer.'}
        </Notice>
      )}
      {update.isError && Object.keys(errorFields(update.error)).length === 0 && (
        <Notice tone="error">{errorMessage(update.error)}</Notice>
      )}
      <div className={styles.actions}>
        <Button onClick={reset} disabled={update.isPending}>
          Remettre les valeurs d’origine
        </Button>
        <Button type="submit" variant="primary" busy={update.isPending} busyLabel="Enregistrement…">
          Enregistrer les paramètres
        </Button>
      </div>
    </form>
  )
}

/** Fichiers proposés à l'export. Les adresses sont celles de l'API, réservées à l'admin. */
const EXPORTS = [
  {
    file: 'students',
    label: 'Élèves',
    detail: 'Pseudo, identifiant, niveau, XP, missions, série, badges et dernière activité.',
  },
  {
    file: 'quests',
    label: 'Quêtes',
    detail: 'Titre, catégorie, format, récompense, deadline, état et avancement.',
  },
  {
    file: 'assignments',
    label: 'Réalisations',
    detail:
      'Une ligne par quête et par élève\u00A0: statut, dates, tentatives, score et XP attribuée.',
  },
  {
    file: 'xp-journal',
    label: 'Journal d’XP',
    detail: 'Chaque gain ou retrait d’XP, pour les élèves comme pour les bots.',
  },
] as const

function ExportCard() {
  return (
    <Card className={styles.section}>
      <h2>Export des données</h2>
      <p className={styles.note}>
        Des fichiers CSV, à ouvrir dans un tableur comme Excel, LibreOffice ou Numbers.
      </p>
      <ul className={styles.exports}>
        {EXPORTS.map((entry) => (
          <li key={entry.file} className={styles.export}>
            <span className={styles.exportText}>
              <span className={styles.exportLabel}>{entry.label}</span>
              <span className={styles.note}>{entry.detail}</span>
            </span>
            <ButtonAnchor
              href={`/api/admin/export/${entry.file}.csv`}
              download
              aria-label={`Télécharger le fichier ${entry.label}`}
            >
              Télécharger
            </ButtonAnchor>
          </li>
        ))}
      </ul>
    </Card>
  )
}
