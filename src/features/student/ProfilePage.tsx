import { useState, type FormEvent } from 'react'
import { changePasswordRequestSchema } from '../../../shared/schemas/auth'
import { useChangePassword, useCurrentUser, useLogout } from '../../app/session'
import { errorFields, errorMessage } from '../../lib/api'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { CopyButton } from '../../ui/CopyButton'
import { PasswordField } from '../../ui/Field'
import { Identifier } from '../../ui/Identifier'
import { Notice } from '../../ui/Notice'
import styles from './ProfilePage.module.css'

/** Profil de l'élève : pseudo, identifiant à recopier, mot de passe, déconnexion. */
export function ProfilePage() {
  const user = useCurrentUser()
  const logout = useLogout()

  return (
    <>
      <h1>Profil</h1>

      <Card className={styles.identity}>
        <Avatar avatar={user.avatar} size="large" />
        <div>
          <h2>{user.pseudo}</h2>
          {user.publicId && (
            <p className={styles.identifierLine}>
              <span className={styles.caption}>Identifiant</span>
              <Identifier value={user.publicId} />
            </p>
          )}
        </div>
        {user.publicId && <CopyButton text={user.publicId} label="Copier mon identifiant" />}
      </Card>

      <ChangePasswordCard />

      <Button
        variant="secondary"
        className={styles.logout}
        onClick={() => logout.mutate(undefined)}
        disabled={logout.isPending}
      >
        Se déconnecter
      </Button>
    </>
  )
}

function ChangePasswordCard() {
  const changePassword = useChangePassword()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' })
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const serverFields = errorFields(changePassword.error)
  const errors = { ...serverFields, ...localErrors }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = changePasswordRequestSchema.safeParse(form)
    if (!parsed.success) {
      const issues: Record<string, string> = {}
      for (const issue of parsed.error.issues) issues[String(issue.path[0])] ??= issue.message
      setLocalErrors(issues)
      return
    }
    if (form.currentPassword === '') {
      setLocalErrors({ currentPassword: 'Mot de passe actuel requis.' })
      return
    }
    setLocalErrors({})
    changePassword.mutate(parsed.data, {
      onSuccess: () => setForm({ currentPassword: '', newPassword: '' }),
    })
  }

  return (
    <Card>
      <form className={styles.form} onSubmit={submit} noValidate>
        <h2>Changer de mot de passe</h2>
        {changePassword.isSuccess && <Notice tone="success">Mot de passe changé.</Notice>}
        {changePassword.isError && Object.keys(serverFields).length === 0 && (
          <Notice tone="error">{errorMessage(changePassword.error)}</Notice>
        )}
        <PasswordField
          label="Mot de passe actuel"
          name="currentPassword"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
          error={errors.currentPassword}
        />
        <PasswordField
          label="Nouveau mot de passe"
          name="newPassword"
          autoComplete="new-password"
          value={form.newPassword}
          onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
          hint="8 caractères au minimum."
          error={errors.newPassword}
        />
        <Button type="submit" busy={changePassword.isPending} busyLabel="Enregistrement…">
          Changer le mot de passe
        </Button>
      </form>
    </Card>
  )
}
