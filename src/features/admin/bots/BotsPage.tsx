import { useState } from 'react'
import { useLocation } from 'react-router'
import { BOT_MODES, BOT_TARGETS } from '../../../../shared/rules/bots'
import {
  BOT_ADJUST_MISSIONS_MAX,
  BOT_ADJUST_XP_MAX,
  adjustBotRequestSchema,
} from '../../../../shared/schemas/leaderboard'
import { errorMessage } from '../../../lib/api'
import { Avatar } from '../../../ui/Avatar'
import { Button, ButtonLink } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { Checkbox } from '../../../ui/Choice'
import { Chip } from '../../../ui/Chip'
import { Dialog, DialogActions } from '../../../ui/Dialog'
import { EmptyState } from '../../../ui/EmptyState'
import { Field } from '../../../ui/Field'
import { Notice } from '../../../ui/Notice'
import { Leaderboard } from '../../leaderboard/Leaderboard'
import { formatXp } from '../../quests/QuestChips'
import {
  useAdjustBot,
  useBots,
  useDeleteBot,
  useSettings,
  useUpdateBot,
  useUpdateSettings,
  type AdminBot,
} from './bots-api'
import styles from './BotsPage.module.css'

/** Rythme d'un bot, en une phrase. */
function rhythm(bot: AdminBot): string {
  if (bot.mode === 'regular') {
    return `Régulier · ${bot.missionsPerWeek} mission${bot.missionsPerWeek > 1 ? 's' : ''} par semaine`
  }
  const target = BOT_TARGETS.find((candidate) => candidate.id === bot.target)
  return `${BOT_MODES[1].label} · ${target?.label.toLocaleLowerCase('fr-FR') ?? ''}`
}

/** Bots : de faux participants qui donnent du rythme au classement. */
export function BotsPage() {
  const bots = useBots()
  const settings = useSettings()
  const updateSettings = useUpdateSettings()
  const arrival = (useLocation().state as { notice?: string } | null)?.notice ?? null
  const [notice, setNotice] = useState<string | null>(arrival)
  const [chosenLabel, setChosenLabel] = useState<boolean | null>(null)
  const all = bots.data ?? []

  return (
    <>
      <div className={styles.heading}>
        <h1>Bots</h1>
        <ButtonLink to="/admin/bots/nouveau" variant="primary">
          Nouveau bot
        </ButtonLink>
      </div>
      {notice && <Notice tone="success">{notice}</Notice>}
      {bots.isError && <Notice tone="error">{errorMessage(bots.error)}</Notice>}
      {bots.isPending && <p>Chargement des bots…</p>}

      {bots.isSuccess && all.length === 0 && (
        <EmptyState emoji="🤖" title="Aucun bot pour l’instant">
          <p>
            Un bot est un faux participant qui progresse tout seul, pour donner du rythme au
            classement de vos élèves.
          </p>
        </EmptyState>
      )}

      {all.length > 0 && (
        <ul className={styles.list}>
          {all.map((bot) => (
            <BotCard key={bot.id} bot={bot} onNotice={setNotice} />
          ))}
        </ul>
      )}

      <Card className={styles.section}>
        <h2>Ce que voient les élèves</h2>
        <Checkbox
          label="Montrer l’étiquette « Bot » aux élèves"
          hint="Sans elle, rien ne distingue un bot d’un élève dans leur leaderboard."
          // La case suit le geste tout de suite, sans attendre la réponse du serveur ;
          // en cas d'échec, elle revient à la valeur enregistrée.
          checked={chosenLabel ?? settings.data?.showBotLabel ?? false}
          disabled={!settings.isSuccess}
          onChange={(event) => {
            setChosenLabel(event.target.checked)
            updateSettings.mutate(
              { showBotLabel: event.target.checked },
              { onError: () => setChosenLabel(null) },
            )
          }}
        />
        {updateSettings.isError && (
          <Notice tone="error">{errorMessage(updateSettings.error)}</Notice>
        )}
      </Card>

      <section className={styles.section} aria-labelledby="bots-leaderboard">
        <h2 id="bots-leaderboard">Classement</h2>
        <Leaderboard />
      </section>
    </>
  )
}

interface BotCardProps {
  bot: AdminBot
  onNotice: (notice: string) => void
}

function BotCard({ bot, onNotice }: BotCardProps) {
  const update = useUpdateBot(bot.id)
  const [dialog, setDialog] = useState<'adjust' | 'delete' | null>(null)

  const togglePause = () =>
    update.mutate(
      { paused: !bot.paused },
      {
        onSuccess: () =>
          onNotice(bot.paused ? `${bot.pseudo} a repris.` : `${bot.pseudo} est en pause.`),
      },
    )

  return (
    <Card as="li" className={styles.bot}>
      <div className={styles.identity}>
        <Avatar avatar={bot.avatar} decorative />
        <div className={styles.who}>
          <span className={styles.pseudo}>{bot.pseudo}</span>
          <span className={styles.tags}>
            <Chip>Bot</Chip>
            {bot.paused && <Chip tone="warning">En pause</Chip>}
            {bot.capped && <Chip>Plafonné</Chip>}
          </span>
        </div>
      </div>
      <p>{rhythm(bot)}</p>
      <p className={styles.figures}>
        Niveau {bot.level} · {bot.missions} mission{bot.missions > 1 ? 's' : ''} ·{' '}
        {formatXp(bot.xp)} · {bot.missionsThisWeek} cette semaine
      </p>
      {update.isError && <Notice tone="error">{errorMessage(update.error)}</Notice>}
      <div className={styles.actions}>
        <ButtonLink to={`/admin/bots/${bot.id}`} aria-label={`Modifier ${bot.pseudo}`}>
          Modifier
        </ButtonLink>
        <Button
          onClick={togglePause}
          busy={update.isPending}
          busyLabel="…"
          aria-label={bot.paused ? `Reprendre ${bot.pseudo}` : `Mettre ${bot.pseudo} en pause`}
        >
          {bot.paused ? 'Reprendre' : 'Mettre en pause'}
        </Button>
        <Button onClick={() => setDialog('adjust')} aria-label={`Ajuster ${bot.pseudo}`}>
          Ajuster
        </Button>
        <Button
          variant="danger"
          onClick={() => setDialog('delete')}
          aria-label={`Supprimer ${bot.pseudo}`}
        >
          Supprimer
        </Button>
      </div>
      {dialog === 'adjust' && (
        <AdjustDialog
          bot={bot}
          onClose={() => setDialog(null)}
          onDone={() => {
            onNotice(`${bot.pseudo} est ajusté.`)
            setDialog(null)
          }}
        />
      )}
      {dialog === 'delete' && (
        <DeleteDialog
          bot={bot}
          onClose={() => setDialog(null)}
          onDone={() => onNotice(`${bot.pseudo} est supprimé.`)}
        />
      )}
    </Card>
  )
}

interface BotDialogProps {
  bot: AdminBot
  onClose: () => void
  onDone: () => void
}

/** Ajustement manuel : des missions et de l'XP, en plus ou en moins (un nombre négatif retire). */
function AdjustDialog({ bot, onClose, onDone }: BotDialogProps) {
  const adjust = useAdjustBot(bot.id)
  const [missions, setMissions] = useState('')
  const [xp, setXp] = useState('')
  const [problem, setProblem] = useState<string | null>(null)

  const submit = () => {
    const toNumber = (text: string) => (text.trim() === '' ? 0 : Number(text.trim()))
    const parsed = adjustBotRequestSchema.safeParse({
      missions: toNumber(missions),
      xp: toNumber(xp),
    })
    if (!parsed.success) {
      setProblem(
        `Indiquez des missions (de -${BOT_ADJUST_MISSIONS_MAX} à ${BOT_ADJUST_MISSIONS_MAX}) ou de l’XP (de -${BOT_ADJUST_XP_MAX} à ${BOT_ADJUST_XP_MAX}), en nombres entiers.`,
      )
      return
    }
    setProblem(null)
    adjust.mutate(parsed.data, { onSuccess: onDone })
  }

  return (
    <Dialog open title={`Ajuster ${bot.pseudo}`} onClose={onClose}>
      <p>Un nombre négatif retire des missions ou de l’XP.</p>
      <Field
        label="Missions à ajouter"
        inputMode="numeric"
        placeholder="0"
        value={missions}
        onChange={(event) => setMissions(event.target.value)}
      />
      <Field
        label="XP à ajouter"
        inputMode="numeric"
        placeholder="0"
        value={xp}
        onChange={(event) => setXp(event.target.value)}
      />
      {problem && <Notice tone="error">{problem}</Notice>}
      {adjust.isError && <Notice tone="error">{errorMessage(adjust.error)}</Notice>}
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="primary" onClick={submit} busy={adjust.isPending} busyLabel="…">
          Enregistrer l’ajustement
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function DeleteDialog({ bot, onClose, onDone }: BotDialogProps) {
  const remove = useDeleteBot(bot.id)
  return (
    <Dialog open title={`Supprimer ${bot.pseudo}\u00A0?`} onClose={onClose}>
      <p>
        Ce bot disparaîtra du leaderboard, avec tout son passé&nbsp;: ses missions et son XP ne
        compteront plus pour aucune période. Cette action est irréversible.
      </p>
      {remove.isError && <Notice tone="error">{errorMessage(remove.error)}</Notice>}
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="danger"
          onClick={() => remove.mutate(undefined, { onSuccess: onDone })}
          busy={remove.isPending}
          busyLabel="Suppression…"
        >
          Supprimer le bot
        </Button>
      </DialogActions>
    </Dialog>
  )
}
