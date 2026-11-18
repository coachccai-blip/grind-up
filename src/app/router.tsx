import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router'
import { AuthPage } from '../features/auth/AuthPage'
import { NewPasswordPage } from '../features/auth/NewPasswordPage'
import { WelcomePage } from '../features/auth/WelcomePage'
import { ProfilePage } from '../features/student/ProfilePage'
import { StudentLayout } from '../features/student/StudentLayout'
import { MyQuestsPage } from '../features/student/MyQuestsPage'
import { QuestPage } from '../features/student/QuestPage'
import { DashboardPage, LeaderboardPage } from '../features/student/StudentPages'
import { AnonymousOnly, RequireUser, SessionGate } from './guards'
import { NotFoundPage } from './NotFoundPage'

// L'espace admin et le test de déploiement sont chargés à la demande : un élève
// ne télécharge que ce que montre son propre espace.
const AdminApp = lazy(() => import('../features/admin/AdminApp'))
const DeployCheckPage = lazy(() =>
  import('../features/deploy-check/DeployCheckPage').then((module) => ({
    default: module.DeployCheckPage,
  })),
)

const loading = <p className="page-loading">Chargement…</p>

/**
 * Toutes les pages du site. L'espace élève est à la racine, l'espace admin sous
 * /admin ; chacun est fermé à l'autre rôle.
 */
export const router = createBrowserRouter([
  // Test de déploiement : public, pour vérifier une mise en ligne sans compte.
  {
    path: '/sante',
    element: (
      <Suspense fallback={loading}>
        <DeployCheckPage />
      </Suspense>
    ),
  },
  {
    element: <SessionGate />,
    children: [
      {
        element: <AnonymousOnly />,
        children: [
          { path: '/connexion', element: <AuthPage mode="login" /> },
          { path: '/inscription', element: <AuthPage mode="signup" /> },
        ],
      },
      {
        element: <RequireUser />,
        children: [{ path: '/nouveau-mot-de-passe', element: <NewPasswordPage /> }],
      },
      {
        element: <RequireUser role="student" />,
        children: [
          { path: '/bienvenue', element: <WelcomePage /> },
          {
            element: <StudentLayout />,
            children: [
              { path: '/', element: <DashboardPage /> },
              { path: '/quetes', element: <MyQuestsPage /> },
              { path: '/quetes/:questId', element: <QuestPage /> },
              { path: '/leaderboard', element: <LeaderboardPage /> },
              { path: '/profil', element: <ProfilePage /> },
            ],
          },
        ],
      },
      {
        element: <RequireUser role="admin" />,
        children: [
          {
            path: '/admin/*',
            element: (
              <Suspense fallback={loading}>
                <AdminApp />
              </Suspense>
            ),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
