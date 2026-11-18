import { createBrowserRouter } from 'react-router'
import { AdminLayout } from '../features/admin/AdminLayout'
import { BotsPage, OverviewPage, SettingsPage } from '../features/admin/AdminPages'
import { QuestDetailPage } from '../features/admin/quests/QuestDetailPage'
import { QuestEditorPage } from '../features/admin/quests/QuestEditorPage'
import { QuestsPage } from '../features/admin/quests/QuestsPage'
import { ValidationsPage } from '../features/admin/quests/ValidationsPage'
import { StudentPage } from '../features/admin/StudentPage'
import { StudentsPage } from '../features/admin/StudentsPage'
import { AuthPage } from '../features/auth/AuthPage'
import { NewPasswordPage } from '../features/auth/NewPasswordPage'
import { WelcomePage } from '../features/auth/WelcomePage'
import { DeployCheckPage } from '../features/deploy-check/DeployCheckPage'
import { ProfilePage } from '../features/student/ProfilePage'
import { StudentLayout } from '../features/student/StudentLayout'
import { MyQuestsPage } from '../features/student/MyQuestsPage'
import { QuestPage } from '../features/student/QuestPage'
import { DashboardPage, LeaderboardPage } from '../features/student/StudentPages'
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
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <OverviewPage /> },
              { path: 'eleves', element: <StudentsPage /> },
              { path: 'eleves/:id', element: <StudentPage /> },
              { path: 'quetes', element: <QuestsPage /> },
              { path: 'quetes/nouvelle', element: <QuestEditorPage /> },
              { path: 'quetes/:id', element: <QuestDetailPage /> },
              { path: 'quetes/:id/modifier', element: <QuestEditorPage /> },
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
