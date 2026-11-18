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

/** Un élève dans son propre navigateur, un admin dans la page du test, et une quête pour l'élève. */
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
  const title = `Calcul ${uniquePseudo('q')}`
  const quest = await publishQuest(page, {
    title,
    items: [{ prompt: '6 × 7 ?', answers: ['42'] }],
    assignees: [studentId],
  })
  return { pseudo, student, studentId, title, quest, close: () => studentContext.close() }
}

/** L'élève ouvre sa quête et donne la bonne réponse. */
async function validateQuest(student: Page, title: string): Promise<void> {
  await student.goto('/quetes')
  await student.getByRole('link', { name: new RegExp(title) }).click()
  await student.getByLabel('1. 6 × 7 ?').fill('42')
  await student.getByRole('button', { name: 'Valider mes réponses' }).click()
}

test.describe('progression de l’élève', () => {
  test('l’XP, le niveau, la série et les badges suivent sans recharger la page', async ({
    browser,
    page,
  }) => {
    const { student, title, close } = await scene(browser, page)

    // Avant : niveau 1, aucune mission, série à lancer.
    await student.goto('/')
    await expect(student.getByRole('heading', { name: 'Niveau 1' })).toBeVisible()
    await expect(student.getByText('Valide une quête pour la lancer')).toBeVisible()

    await validateQuest(student, title)
    // 100 XP + 10 de bonus sans faute : passage au niveau 2 et premier badge.
    await acknowledgeCelebration(student, [
      '+110\u00A0XP',
      /Niveau 2/,
      'Nouveau badge\u00A0: Premier pas',
    ])

    // Le tableau de bord est à jour, par la navigation, sans rechargement.
    await openStudentScreen(student, 'Tableau de bord')
    await expect(student.getByRole('heading', { name: 'Niveau 2' })).toBeVisible()
    await expect(student.getByText('Niveau 2 · 110\u00A0XP')).toBeVisible()
    await expect(student.getByText('10\u00A0XP sur 200\u00A0XP')).toBeVisible()
    await expect(student.getByText('Encore 190\u00A0XP avant le niveau 3')).toBeVisible()
    const bar = student.getByRole('progressbar', { name: 'Progression vers le niveau 3' })
    await expect(bar).toHaveAttribute('value', '10')
    await expect(bar).toHaveAttribute('max', '200')
    await expect(student.getByText('1\u00A0jour', { exact: true })).toBeVisible()
    await expect(student.getByText('Record\u00A0: 1\u00A0jour')).toBeVisible()
    await expect(student.getByText('quête validée', { exact: true })).toBeVisible()
    const rewards = student.locator('section, article').filter({ hasText: 'Dernières récompenses' })
    await expect(rewards.getByText(title, { exact: true })).toBeVisible()
    await expect(rewards.getByText(`Bonus sans faute\u00A0: ${title}`)).toBeVisible()

    // Le profil montre le badge obtenu, les badges à débloquer et l'historique.
    await openStudentScreen(student, 'Profil')
    const badges = student.locator('section').filter({ hasText: 'Badges' })
    await expect(badges.getByRole('listitem').filter({ hasText: 'Premier pas' })).toContainText(
      'Obtenu le',
    )
    await expect(badges.getByRole('listitem').filter({ hasText: 'Matheux' })).toContainText(
      'Valide 10 quêtes de maths. Tu en es à 1 sur 10.',
    )
    await expect(badges.getByRole('listitem')).toHaveCount(9)
    const history = student.locator('section').filter({ hasText: 'Historique d’XP' })
    await expect(history.getByText('+100\u00A0XP')).toBeVisible()
    await expect(history.getByText('+10\u00A0XP')).toBeVisible()
    await expectNoHorizontalScroll(student)
    await close()
  })

  test('l’annonce s’affiche sans animation quand l’appareil demande de les réduire', async ({
    browser,
    page,
  }) => {
    const { student, title, close } = await scene(browser, page)
    await student.emulateMedia({ reducedMotion: 'reduce' })

    await validateQuest(student, title)

    // Le gain est affiché d'emblée à sa valeur, sans décompte.
    const announcement = student.getByRole('dialog', { name: 'Quête validée' })
    await expect(announcement).toBeVisible()
    await expect(announcement.getByText('+110\u00A0XP').first()).toBeVisible()
    await acknowledgeCelebration(student)
    await close()
  })

  test('l’élève choisit son avatar dans la galerie', async ({ page }) => {
    await signUpStudent(page, uniquePseudo('Noa'))
    await openStudentScreen(page, 'Profil')

    await page.getByText('Changer d’avatar').click()
    // L'élève touche l'avatar lui-même : c'est le libellé de son bouton radio.
    await page.locator('label').filter({ hasText: 'Chouette' }).click()
    await expect(page.getByRole('radio', { name: 'Chouette' })).toBeChecked()

    await expect(page.getByRole('img', { name: 'Avatar\u00A0: Chouette' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('img', { name: 'Avatar\u00A0: Chouette' })).toBeVisible()
  })
})

test.describe('progression vue par l’admin', () => {
  test('la liste et la fiche d’un élève montrent son niveau, son XP, ses quêtes et son journal', async ({
    browser,
    page,
  }) => {
    const { pseudo, student, title, close } = await scene(browser, page)
    await validateQuest(student, title)
    await acknowledgeCelebration(student)

    await openAdminScreen(page, 'Élèves')
    await page.getByLabel('Rechercher un élève').fill(pseudo)
    const row = page.getByRole('link', { name: new RegExp(pseudo) })
    await expect(row).toContainText('Niveau 2 · 110\u00A0XP · 1 mission')
    await row.click()

    const progression = page.locator('section').filter({ hasText: 'Progression' })
    await expect(progression).toContainText('110\u00A0XP')
    await expect(progression).toContainText('1\u00A0jour')
    const quests = page.locator('section').filter({ hasText: /^Quêtes/ })
    await expect(quests.getByRole('listitem').filter({ hasText: title })).toContainText('Validée')
    const journal = page.locator('section').filter({ hasText: 'Journal d’XP' })
    await expect(journal.getByText(title, { exact: true })).toBeVisible()
    await expect(
      page.locator('section').filter({ hasText: 'Badges' }).getByRole('listitem').first(),
    ).toContainText('Obtenu le')
    await expectNoHorizontalScroll(page)
    await close()
  })

  test('l’admin ajuste l’XP avec un motif, que l’élève retrouve dans son historique', async ({
    browser,
    page,
  }) => {
    const { pseudo, student, studentId, close } = await scene(browser, page)

    await page.goto(`/admin/eleves/${studentId}`)
    await page.getByRole('button', { name: 'Ajuster l’XP' }).click()
    const dialog = page.getByRole('dialog')
    // Sans montant ni motif, rien n'est enregistré.
    await dialog.getByRole('button', { name: 'Enregistrer l’ajustement' }).click()
    await expect(dialog.getByText('Indiquez un nombre entier, de 1 à 10000.')).toBeVisible()
    await dialog.getByLabel('Montant (en XP)').fill('250')
    await dialog.getByLabel('Motif').fill('Aide apportée à un camarade')
    await dialog.getByRole('button', { name: 'Enregistrer l’ajustement' }).click()

    await expect(
      page.getByText(`+250\u00A0XP pour ${pseudo}\u00A0: ajustement enregistré.`),
    ).toBeVisible()
    const journal = page.locator('section').filter({ hasText: 'Journal d’XP' })
    await expect(journal.getByText('Aide apportée à un camarade')).toBeVisible()

    // Retrait : le sens se choisit, le montant reste positif à la saisie.
    await page.getByRole('button', { name: 'Ajuster l’XP' }).click()
    await dialog.getByRole('radio', { name: 'Retirer de l’XP' }).check()
    await dialog.getByLabel('Montant (en XP)').fill('40')
    await dialog.getByLabel('Motif').fill('Erreur de saisie')
    await dialog.getByRole('button', { name: 'Enregistrer l’ajustement' }).click()
    await expect(journal.getByText('-40\u00A0XP')).toBeVisible()

    await student.goto('/')
    await expect(student.getByText('Niveau 2 · 210\u00A0XP')).toBeVisible()
    await expect(student.getByText('Aide apportée à un camarade')).toBeVisible()
    await close()
  })

  test('l’admin annule une validation : l’XP est retirée et l’élève peut recommencer', async ({
    browser,
    page,
  }) => {
    const { pseudo, student, studentId, title, close } = await scene(browser, page)
    await validateQuest(student, title)
    await acknowledgeCelebration(student)

    await page.goto(`/admin/eleves/${studentId}`)
    const quests = page.locator('section').filter({ hasText: /^Quêtes/ })
    await quests.getByRole('button', { name: `Annuler la validation de « ${title} »` }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText(`${pseudo} perdra les 110\u00A0XP`)
    await dialog.getByLabel('Commentaire pour l’élève').fill('Refais-la sans aide.')
    await dialog.getByRole('button', { name: 'Annuler la validation' }).click()

    await expect(page.getByText(`Validation de « ${title} » annulée.`)).toBeVisible()
    await expect(quests.getByRole('listitem').filter({ hasText: title })).toContainText('Refusée')
    const journal = page.locator('section').filter({ hasText: 'Journal d’XP' })
    await expect(journal.getByText(`Validation annulée\u00A0: ${title}`)).toBeVisible()
    await expect(journal.getByText('-110\u00A0XP')).toBeVisible()

    // Côté élève : l'XP est repartie, la quête est à reprendre avec le commentaire.
    await student.goto('/')
    await expect(student.getByText('Niveau 1 · 0\u00A0XP')).toBeVisible()
    await student.getByRole('link', { name: new RegExp(title) }).click()
    await expect(student.getByRole('heading', { name: 'À reprendre' })).toBeVisible()
    await expect(student.getByText('Refais-la sans aide.')).toBeVisible()
    await close()
  })
})
