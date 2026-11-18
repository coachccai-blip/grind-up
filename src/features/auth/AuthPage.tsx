import { useState, type FormEvent } from 'react'
import { NavLink } from 'react-router'
import { loginRequestSchema, signupRequestSchema } from '../../../shared/schemas/auth'
import { useLogin, useSignup } from '../../app/session'
import { errorFields, errorMessage } from '../../lib/api'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { classes } from '../../ui/classes'
import { Field, PasswordField } from '../../ui/Field'
import { Notice } from '../../ui/Notice'
import { AuthLayout } from './AuthLayout'
import styles from './AuthPage.module.css'
import { takeSessionExpiredFlag } from './session-expired'

type Mode = 'login' | 'signup'

/** Messages par champ issus d'une validation locale (mêmes règles que le serveur). */
function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of issues) errors[String(issue.path[0] ?? '_')] ??= issue.message
  return errors
}

/**
 * Écran unique de connexion et d'inscription. Le même formulaire d'inscription
 * sert aux deux rôles : sans code spécial, le compte créé est un compte élève.
 */
export function AuthPage({ mode }: { mode: Mode }) {
  const [sessionExpired] = useState(takeSessionExpiredFlag)

  return (
    <AuthLayout>
      {sessionExpired && <Notice>Ta session a expiré. Reconnecte-toi pour continuer.</Notice>}
      <Card>
        <nav className={styles.tabs} aria-label="Connexion ou inscription">
          <AuthTab to="/connexion">Connexion</AuthTab>
          <AuthTab to="/inscription">Inscription</AuthTab>
        </nav>
        {mode === 'login' ? <LoginForm /> : <SignupForm />}
      </Card>
    </AuthLayout>
  )
}

function AuthTab({ to, children }: { to: string; children: string }) {
  return (
    <NavLink
      to={to}
      replace
      className={({ isActive }) => classes(styles.tab, isActive && styles.activeTab)}
    >
      {children}
    </NavLink>
  )
}

function LoginForm() {
  const login = useLogin()
  const [form, setForm] = useState({ login: '', password: '' })
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const errors = { ...errorFields(login.error), ...localErrors }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = loginRequestSchema.safeParse(form)
    if (!parsed.success) {
      setLocalErrors(fieldErrors(parsed.error.issues))
      return
    }
    setLocalErrors({})
    login.mutate(parsed.data)
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h1 className={styles.title}>Se connecter</h1>
      {login.isError && Object.keys(errorFields(login.error)).length === 0 && (
        <Notice tone="error">{errorMessage(login.error)}</Notice>
      )}
      <Field
        label="Identifiant ou pseudo"
        name="login"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={form.login}
        onChange={(event) => setForm({ ...form, login: event.target.value })}
        error={errors.login}
      />
      <PasswordField
        label="Mot de passe"
        name="password"
        autoComplete="current-password"
        value={form.password}
        onChange={(event) => setForm({ ...form, password: event.target.value })}
        error={errors.password}
      />
      <Button
        type="submit"
        variant="primary"
        fullWidth
        busy={login.isPending}
        busyLabel="Connexion…"
      >
        Se connecter
      </Button>
      <p className={styles.help}>
        Mot de passe oublié&nbsp;? Demande un mot de passe temporaire à ton accompagnant.
      </p>
    </form>
  )
}

function SignupForm() {
  const signup = useSignup()
  const [form, setForm] = useState({ pseudo: '', password: '', specialCode: '' })
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const serverFields = errorFields(signup.error)
  const errors = { ...serverFields, ...localErrors }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = signupRequestSchema.safeParse(form)
    if (!parsed.success) {
      setLocalErrors(fieldErrors(parsed.error.issues))
      return
    }
    setLocalErrors({})
    signup.mutate(parsed.data)
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h1 className={styles.title}>Créer un compte</h1>
      {signup.isError && Object.keys(serverFields).length === 0 && (
        <Notice tone="error">{errorMessage(signup.error)}</Notice>
      )}
      <Field
        label="Pseudo"
        name="pseudo"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={20}
        value={form.pseudo}
        onChange={(event) => setForm({ ...form, pseudo: event.target.value })}
        hint="3 à 20 caractères&nbsp;: lettres, chiffres et tirets. Ne mets pas ton vrai nom."
        error={errors.pseudo}
      />
      <PasswordField
        label="Mot de passe"
        name="password"
        autoComplete="new-password"
        value={form.password}
        onChange={(event) => setForm({ ...form, password: event.target.value })}
        hint="8 caractères au minimum."
        error={errors.password}
      />
      <details className={styles.specialCode}>
        <summary>J’ai un code spécial</summary>
        <Field
          label="Code spécial"
          name="specialCode"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={form.specialCode}
          onChange={(event) => setForm({ ...form, specialCode: event.target.value })}
          hint="Réservé à l’accompagnant. Sans code, laisse ce champ vide."
          error={errors.specialCode}
        />
      </details>
      <Button
        type="submit"
        variant="primary"
        fullWidth
        busy={signup.isPending}
        busyLabel="Création…"
      >
        Créer mon compte
      </Button>
    </form>
  )
}
