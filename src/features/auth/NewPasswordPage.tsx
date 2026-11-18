import { useState, type FormEvent } from 'react'
import { passwordSchema } from '../../../shared/schemas/auth'
import { useChangePassword, useLogout } from '../../app/session'
import { errorFields, errorMessage } from '../../lib/api'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { PasswordField } from '../../ui/Field'
import { Notice } from '../../ui/Notice'
import { AuthLayout } from './AuthLayout'
import styles from './AuthPage.module.css'

/** Après une connexion avec un mot de passe temporaire : il faut choisir le sien avant de continuer. */
export function NewPasswordPage() {
  const changePassword = useChangePassword()
  const logout = useLogout()
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const fieldError = localError ?? errorFields(changePassword.error).newPassword

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = passwordSchema.safeParse(password)
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? null)
      return
    }
    setLocalError(null)
    // Une fois le mot de passe changé, la protection des pages ramène à l'accueil.
    changePassword.mutate({ newPassword: parsed.data })
  }

  return (
    <AuthLayout>
      <Card>
        <form className={styles.form} onSubmit={submit} noValidate>
          <h1 className={styles.title}>Choisis ton nouveau mot de passe</h1>
          <p>Tu utilises un mot de passe temporaire. Choisis maintenant le tien pour continuer.</p>
          {changePassword.isError && !fieldError && (
            <Notice tone="error">{errorMessage(changePassword.error)}</Notice>
          )}
          <PasswordField
            label="Nouveau mot de passe"
            name="newPassword"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            hint="8 caractères au minimum."
            error={fieldError}
          />
          <Button
            type="submit"
            variant="primary"
            fullWidth
            busy={changePassword.isPending}
            busyLabel="Enregistrement…"
          >
            Enregistrer
          </Button>
          <Button
            variant="quiet"
            onClick={() => logout.mutate(undefined)}
            disabled={logout.isPending}
          >
            Se déconnecter
          </Button>
        </form>
      </Card>
    </AuthLayout>
  )
}
