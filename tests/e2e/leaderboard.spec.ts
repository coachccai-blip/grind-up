import { expect, test, type Browser, type Page } from '@playwright/test'
import {
  acknowledgeCelebration,
  expectNoHorizontalScroll,
  openAdminScreen,
  openStudentScreen,
  publishQuest,
  signUpAdmin,
  signUpStudent,
  uniquePseudo,
} from './helpers'

/** Un élève dans son propre navigateur, un admin dans la page du test. */
async function scene(browser: Browser, page: Page) {
  const pseudo = uniquePseudo('Lea')
  const studentContext = await browser.newContext({ viewport: page.viewportSize() })
  const student = await studentContext.newPage()
  await signUpStudent(student, pseudo)
  await signUpAdmin(page, uniquePseudo('Coach'))
  const students = (await (await page.request.get('/api/admin/students')).json()) as {
    students: { id: string; pseudo: string }[]
  }
  const studentId = students.students.find((candidate) => candidate.pseudo === pseudo)!.id
  return { pseudo, student, studentId, close: () => studentContext.close() }
}

/** L'élève valide une quête créée pour lui, par l'API : une mission de plus au classement. */
async function earnMission(admin: Page, student: Page, studentId: string): Promise<void> {
  const quest = await publishQuest(admin, {
    title: `Défi ${uniquePseudo('q')}`,
    category: 'sport',
    format: 'declarative',
    manualValidation: false,
    instructions: 'Fais-le.',
    assignees: [studentId],
  })
  const response = await student.request.post(`/api/quests/${quest.id}/attempts`, { data: {} })
  expect(response.status()).toBe(200)
  await student.request.post('/api/progress/celebration/seen', { data: {} })
}

test.describe('leaderboard', () => {
  test('l’élève voit son rang, sa ligne mise en avant, les périodes et le tri par XP', async ({
    browser,
    page,
  }) => {
    const { pseudo, student, studentId, close } = await scene(browser, page)

    // Sans mission, il n'est pas encore classé.
    await student.goto('/')
    await expect(student.getByText('pas encore classé cette semaine')).toBeVisible()

    await earnMission(page, student, studentId)
    await openStudentScreen(student, 'Leaderboard')
    await expect(student.getByRole('heading', { level: 1, name: 'Leaderboard' })).toBeVisible()
    const mine = student.getByRole('listitem').filter({ hasText: pseudo })
    await expect(mine).toContainText('Toi')
    await expect(mine).toContainText('1\u00A0mission')
    await expect(mine).toContainText('100\u00A0XP')
    await expect(mine).toContainText('Niveau 2')
    await expect(student.getByText('Classé par missions accomplies.')).toBeVisible()

    // Les trois périodes et le tri par XP changent l'adresse, pas la page.
    await student.getByRole('link', { name: 'Ce mois' }).click()
    await expect(student).toHaveURL(/periode=month/)
    await expect(mine).toContainText('1\u00A0mission')
    await student.getByRole('link', { name: 'Depuis toujours' }).click()
    await expect(student).toHaveURL(/periode=all/)
    await student.getByRole('link', { name: 'Trier par XP' }).click()
    await expect(student).toHaveURL(/tri=xp/)
    await expect(student.getByText('Classé par XP.')).toBeVisible()
    await expect(mine).toContainText('Toi')
    await expectNoHorizontalScroll(student)

    // Le tableau de bord donne son rang de la semaine.
    await openStudentScreen(student, 'Tableau de bord')
    await expect(student.getByText(/^sur \d+ cette semaine$/)).toBeVisible()
    await expect(student.getByText(/^\d+(er|e)$/)).toBeVisible()
    await close()
  })

  test('l’admin crée un bot, qui apparaît dans le classement, s’ajuste, se met en pause et se supprime', async ({
    browser,
    page,
  }) => {
    const { student, close } = await scene(browser, page)

    await openAdminScreen(page, 'Bots')
    await page.getByRole('link', { name: 'Nouveau bot' }).click()
    await expect(page.getByRole('heading', { name: 'Nouveau bot' })).toBeVisible()

    // Un pseudo et un avatar tirés au hasard, puis un pseudo propre à ce parcours.
    await page.getByRole('button', { name: 'Tirer un pseudo et un avatar au hasard' }).click()
    await expect(page.getByLabel('Pseudo')).not.toHaveValue('')
    const bot = uniquePseudo('Bot')
    await page.getByLabel('Pseudo').fill(bot)
    await page.getByLabel('Missions par semaine', { exact: true }).fill('30')
    await page.getByRole('button', { name: 'Créer le bot' }).click()
    await expect(page.getByText('De 1 à 20 missions par semaine.')).toBeVisible()
    await page.getByLabel('Missions par semaine', { exact: true }).fill('7')
    await page.getByRole('button', { name: 'Créer le bot' }).click()

    await expect(page.getByText(`${bot} est créé.`)).toBeVisible()
    const card = page
      .getByRole('listitem')
      .filter({ hasText: 'Régulier · 7 missions par semaine' })
      .filter({ hasText: bot })
    await expect(card).toContainText('Bot')
    await expect(card).toContainText('Plafonné')

    // Dans le classement de l'admin, le bot porte son étiquette.
    const board = page.locator('section').filter({ hasText: 'Classement' })
    await expect(board.getByRole('listitem').filter({ hasText: bot })).toContainText('Bot')

    // Ajustement manuel : vingt missions d'un coup le placent sur le podium.
    await card.getByRole('button', { name: `Ajuster ${bot}` }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Missions à ajouter').fill('20')
    await dialog.getByLabel('XP à ajouter').fill('2000')
    await dialog.getByRole('button', { name: 'Enregistrer l’ajustement' }).click()
    await expect(page.getByText(`${bot} est ajusté.`)).toBeVisible()
    await expect(card).toContainText('20 missions')
    await expect(page.getByRole('list', { name: 'Podium' }).getByText(bot)).toBeVisible()

    // L'élève voit le bot dans son leaderboard, comme un participant.
    await openStudentScreen(student, 'Leaderboard')
    await expect(student.getByRole('list', { name: 'Podium' }).getByText(bot)).toBeVisible()

    // Pause, reprise, puis réglages.
    await card.getByRole('button', { name: `Mettre en pause ${bot}` }).click()
    await expect(page.getByText(`${bot} est en pause.`)).toBeVisible()
    await expect(card).toContainText('En pause')
    await card.getByRole('button', { name: `Reprendre ${bot}` }).click()
    await expect(page.getByText(`${bot} a repris.`)).toBeVisible()
    await card.getByRole('link', { name: `Modifier ${bot}` }).click()
    await page.getByRole('radio', { name: /^Adaptatif/ }).check()
    await page.getByRole('radio', { name: 'Juste derrière le dernier' }).check()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.getByText(`${bot} est mis à jour.`)).toBeVisible()
    const adaptive = page
      .getByRole('listitem')
      .filter({ hasText: bot })
      .filter({ hasText: 'Adaptatif' })
    await expect(adaptive).toContainText('juste derrière le dernier')
    await expectNoHorizontalScroll(page)

    // Suppression : il disparaît du classement, passé compris.
    await adaptive.getByRole('button', { name: `Supprimer ${bot}` }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Supprimer le bot' }).click()
    await expect(page.getByText(`${bot} est supprimé.`)).toBeVisible()
    await expect(page.getByText(bot, { exact: true })).toHaveCount(0)
    await student.reload()
    await expect(student.getByRole('heading', { level: 1, name: 'Leaderboard' })).toBeVisible()
    await expect(student.getByText(bot, { exact: true })).toHaveCount(0)
    await close()
  })

  test('une annonce de badge Podium n’empêche pas de lire le classement', async ({
    browser,
    page,
  }) => {
    const { pseudo, student, studentId, close } = await scene(browser, page)
    const quest = await publishQuest(page, {
      title: `Sprint ${uniquePseudo('q')}`,
      items: [{ prompt: '2 + 2 ?', answers: ['4'] }],
      assignees: [studentId],
    })

    // L'élève valide une quête sous ses yeux : l'annonce, puis le classement à jour.
    await student.goto(`/quetes/${quest.id}`)
    await student.getByLabel('1. 2 + 2 ?').fill('4')
    await student.getByRole('button', { name: 'Valider mes réponses' }).click()
    await acknowledgeCelebration(student, ['+110\u00A0XP'])
    await openStudentScreen(student, 'Leaderboard')

    const mine = student.getByRole('listitem').filter({ hasText: pseudo })
    await expect(mine).toContainText('1\u00A0mission')
    await expect(mine).toContainText('110\u00A0XP')
    await close()
  })
})
