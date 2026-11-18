import { Navigate, useNavigate } from 'react-router'
import { useCurrentUser } from '../../app/session'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { CopyButton } from '../../ui/CopyButton'
import { Identifier } from '../../ui/Identifier'
import { AuthLayout } from './AuthLayout'
import { clearWelcomePending } from './welcome-pending'
import styles from './WelcomePage.module.css'

/** Premier accueil d'un élève : il découvre son identifiant et la consigne de le noter. */
export function WelcomePage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  if (!user.publicId) return <Navigate to="/" replace />

  return (
    <AuthLayout>
      <Card className={styles.card}>
        <Avatar avatar={user.avatar} size="large" decorative />
        <h1>Bienvenue, {user.pseudo}&nbsp;!</h1>
        <p>
          Voici ton identifiant. Note-le bien&nbsp;: il te sert à te connecter et à te faire
          reconnaître par ton accompagnant.
        </p>
        <p className={styles.identifier}>
          <span className="visually-hidden">Ton identifiant&nbsp;: </span>
          <Identifier value={user.publicId} large />
        </p>
        <CopyButton text={user.publicId} label="Copier mon identifiant" />
        <p className={styles.hint}>Tu le retrouveras à tout moment dans ton profil.</p>
        <Button
          variant="primary"
          fullWidth
          onClick={() => {
            clearWelcomePending()
            void navigate('/', { replace: true })
          }}
        >
          C’est noté, continuer
        </Button>
      </Card>
    </AuthLayout>
  )
}
