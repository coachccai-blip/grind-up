import { expect, test } from '@playwright/test'
import {
  acknowledgeCelebration,
  ADMIN_PASSWORD,
  expectNoHorizontalScroll,
  openAdminScreen,
  openStudentScreen,
  PASSWORD,
  uniquePseudo,
  watchForProblems,
} from './helpers'

/**
 * Le parcours complet demandé par le brief (section 11), d'un bout à l'autre et
 * par l'interface seule : inscription de l'élève, création et assignation par
 * l'admin, réalisation, validation, mise à jour du leaderboard.
 */
test('parcours complet : inscription, quête créée et assignée, réalisation, validation, leaderboard', async ({
  browser,
  page,
}) => {
  test.slow()
  const problems = watchForProblems(page)
  const pseudo = uniquePseudo('Nina')
  const coach = uniquePseudo('Coach')
  const title = `Exposé ${uniquePseudo('q')}`

  // 1. L'élève s'inscrit avec un pseudo et reçoit son identifiant XXXX-XXXX.
  await page.goto('/inscription')
  await page.getByLabel('Pseudo').fill(pseudo)
  await page.getByLabel('Mot de passe').fill(PASSWORD)
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page.getByRole('heading', { name: `Bienvenue, ${pseudo}` })).toBeVisible()
  const identifier = (await page.getByText(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/).textContent()) ?? ''
  expect(identifier).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/)
  await page.getByRole('button', { name: 'C’est noté, continuer' }).click()
  await expect(page.getByRole('heading', { name: `Bonjour, ${pseudo}` })).toBeVisible()
  await expect(page.getByText('Niveau 1 · 0\u00A0XP')).toBeVisible()

  // 2. L'admin s'inscrit avec le code spécial, crée une quête et l'assigne à cet élève.
  const adminContext = await browser.newContext({ viewport: page.viewportSize() })
  const admin = await adminContext.newPage()
  const adminProblems = watchForProblems(admin)
  await admin.goto('/inscription')
  await admin.getByLabel('Pseudo').fill(coach)
  await admin.getByLabel('Mot de passe').fill(ADMIN_PASSWORD)
  await admin.getByText('J’ai un code spécial').click()
  await admin.getByLabel('Code spécial').fill('SuperAdmin')
  await admin.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(admin.getByRole('heading', { name: 'Vue d’ensemble' })).toBeVisible()

  await openAdminScreen(admin, 'Quêtes')
  await admin.getByRole('link', { name: 'Nouvelle quête' }).click()
  await admin.getByRole('radio', { name: 'Autre', exact: true }).check()
  await expect(admin.getByRole('radio', { name: /^Réponse libre/ })).toBeChecked()
  await admin.getByLabel('Titre').fill(title)
  await admin.getByLabel('Consigne').fill('Présente ton animal préféré en **cinq lignes**.')
  await admin.getByRole('radio', { name: /Difficile/ }).check()
  await expect(admin.getByLabel('Récompense (en XP)')).toHaveValue('200')
  // Assignée à cet élève seulement, retrouvé par son identifiant.
  await admin.getByRole('radio', { name: 'Choisir les élèves' }).check()
  await admin.getByLabel('Rechercher un élève').fill(identifier)
  await admin.getByRole('checkbox', { name: new RegExp(pseudo) }).check()
  await admin.getByRole('button', { name: 'Publier la quête' }).click()
  await expect(admin.getByText('Quête publiée.')).toBeVisible()
  await expect(admin.getByRole('heading', { level: 1, name: title })).toBeVisible()

  // 3. L'élève voit aussitôt la quête et la réalise.
  await openStudentScreen(page, 'Mes quêtes')
  await page.getByRole('link', { name: new RegExp(title) }).click()
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  await expect(page.getByText('200\u00A0XP')).toBeVisible()
  await page
    .getByLabel('Ta réponse')
    .fill('Le renard : il est rusé, discret, et il vit près de chez moi.')
  await page.getByRole('button', { name: 'Envoyer ma réponse' }).click()
  await expect(page.getByText('Réponse envoyée')).toBeVisible()
  // Rien n'est crédité tant que l'admin n'a pas validé.
  await openStudentScreen(page, 'Tableau de bord')
  await expect(page.getByText('Niveau 1 · 0\u00A0XP')).toBeVisible()

  // 4. L'admin valide la réalisation depuis sa file.
  await openAdminScreen(admin, 'Vue d’ensemble')
  await expect(admin.getByRole('link', { name: /à valider/ })).toBeVisible()
  await openAdminScreen(admin, 'Validations')
  const entry = admin.getByRole('listitem').filter({ hasText: pseudo })
  await expect(entry).toContainText('Le renard : il est rusé')
  await entry.getByRole('button', { name: `Valider la réalisation de ${pseudo}` }).click()
  await expect(entry).toHaveCount(0)

  // 5. L'élève est crédité : annonce, XP, niveau, mission, sans recharger à la main.
  await openStudentScreen(page, 'Mes quêtes')
  await acknowledgeCelebration(page, ['Quête validée', '+200\u00A0XP', 'Niveau 2\u00A0!'])
  await openStudentScreen(page, 'Tableau de bord')
  await expect(page.getByText('Niveau 2 · 200\u00A0XP')).toBeVisible()

  // 6. Le leaderboard est à jour, pour l'élève comme pour l'admin.
  await openStudentScreen(page, 'Leaderboard')
  await page.getByRole('link', { name: 'Depuis toujours' }).click()
  const mine = page.getByRole('listitem').filter({ hasText: pseudo }).first()
  await expect(mine).toContainText('1 mission')
  await expect(mine).toContainText('200\u00A0XP')
  await expect(mine).toContainText('Toi')
  await expectNoHorizontalScroll(page)

  await openAdminScreen(admin, 'Bots')
  await admin.getByRole('link', { name: 'Depuis toujours' }).click()
  await expect(admin.getByRole('listitem').filter({ hasText: pseudo }).first()).toContainText(
    '1 mission',
  )
  // L'admin n'apparaît pas dans le classement.
  await expect(admin.getByRole('listitem').filter({ hasText: coach })).toHaveCount(0)

  expect(problems).toEqual([])
  expect(adminProblems).toEqual([])
  await adminContext.close()
})
