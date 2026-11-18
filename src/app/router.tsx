import { createBrowserRouter } from 'react-router'
import { AdminLayout } from '../features/admin/AdminLayout'
import {
  BotsPage,
  OverviewPage,
  QuestsAdminPage,
  SettingsPage,
  ValidationsPage,
} from '../features/admin/AdminPages'
import { StudentPage } from '../features/admin/StudentPage'
import { StudentsPage } from '../features/admin/StudentsPage'
import { AuthPage } from '../features/auth/AuthPage'
import { NewPasswordPage } from '../features/auth/NewPasswordPage'
import { WelcomePage } from '../features/auth/WelcomePage'
import { DeployCheckPage } from '../features/deploy-check/DeployCheckPage'
import { ProfilePage } from '../features/student/ProfilePage'
import { StudentLayout } from '../features/student/StudentLayout'
import { DashboardPage, LeaderboardPage, QuestsPage } from '../features/student/StudentPages'
import { AnonymousOnly, RequireUser, SessionGate } from './guards'
import { NotFoundPage } from './NotFoundPage'

/**
 * Toutes les pages du site. L'espace élève est à la racine, l'espace admin sous
 * /admin ; chacun est fermé à l'autre rôle.
 */
export const router = createBrowserRouter([
  // Test de déploiement : public, pour vérifier une mise en ligne sans compte.
  { path: '/sante', element: <DeployCheckPage /> },
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
              { path: '/quetes', element: <QuestsPage /> },
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
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <OverviewPage /> },
              { path: 'eleves', element: <StudentsPage /> },
              { path: 'eleves/:id', element: <StudentPage /> },
              { path: 'quetes', element: <QuestsAdminPage /> },
              { path: 'validations', element: <ValidationsPage /> },
              { path: 'bots', element: <BotsPage /> },
              { path: 'parametres', element: <SettingsPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
