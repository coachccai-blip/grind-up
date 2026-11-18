import { Route, Routes } from 'react-router'
import { NotFoundPage } from '../../app/NotFoundPage'
import { AdminLayout } from './AdminLayout'
import { OverviewPage } from './AdminPages'
import { BotEditorPage } from './bots/BotEditorPage'
import { BotsPage } from './bots/BotsPage'
import { LibraryPage } from './quests/LibraryPage'
import { QuestDetailPage } from './quests/QuestDetailPage'
import { QuestEditorPage } from './quests/QuestEditorPage'
import { QuestsPage } from './quests/QuestsPage'
import { ValidationsPage } from './quests/ValidationsPage'
import { SettingsPage } from './settings/SettingsPage'
import { StudentPage } from './StudentPage'
import { StudentsPage } from './StudentsPage'

/**
 * Tout l'espace admin, sous /admin. Il est chargé à part : le navigateur d'un
 * élève ne télécharge jamais le code des écrans de l'admin.
 */
export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="eleves" element={<StudentsPage />} />
        <Route path="eleves/:id" element={<StudentPage />} />
        <Route path="quetes" element={<QuestsPage />} />
        <Route path="quetes/nouvelle" element={<QuestEditorPage />} />
        <Route path="quetes/bibliotheque" element={<LibraryPage />} />
        <Route path="quetes/:id" element={<QuestDetailPage />} />
        <Route path="quetes/:id/modifier" element={<QuestEditorPage />} />
        <Route path="validations" element={<ValidationsPage />} />
        <Route path="bots" element={<BotsPage />} />
        <Route path="bots/nouveau" element={<BotEditorPage />} />
        <Route path="bots/:id" element={<BotEditorPage />} />
        <Route path="parametres" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
