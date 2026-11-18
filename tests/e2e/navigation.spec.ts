import { expect, test } from '@playwright/test'
import {
  isPhone,
  openAdminScreen,
  openStudentScreen,
  publishQuest,
  signUpAdmin,
  signUpStudent,
  uniquePseudo,
} from './helpers'

/**
 * Ce qui accompagne chaque changement d'écran : le titre de l'onglet, le retour
 * en haut de la page, l'annonce aux lecteurs d'écran, le lien d'évitement.
 */
test.describe('navigation', () => {
  test('le titre de l’onglet suit l’écran affiché', async ({ page }) => {
    await page.goto('/connexion')
    await expect(page).toHaveTitle('Se connecter · Grind up')
    await page.getByRole('link', { name: 'Inscription' }).click()
    await expect(page).toHaveTitle('Créer un compte · Grind up')

    const pseudo = uniquePseudo('Lina')
    await signUpStudent(page, pseudo)
    await expect(page).toHaveTitle('Tableau de bord · Grind up')
    await openStudentScreen(page, 'Mes quêtes')
    await expect(page).toHaveTitle('Mes quêtes · Grind up')
    await openStudentScreen(page, 'Leaderboard')
    await expect(page).toHaveTitle('Leaderboard · Grind up')
    // Chaque nouvel écran est annoncé aux lecteurs d'écran.
    await expect(page.getByRole('status').filter({ hasText: /^Leaderboard$/ })).toHaveCount(1)
    await openStudentScreen(page, 'Profil')
    await expect(page).toHaveTitle('Profil · Grind up')

    await page.goto('/une-adresse-qui-n-existe-pas')
    await expect(page).toHaveTitle(/introuvable · Grind up$/)
    await page.goto('/sante')
    await expect(page).toHaveTitle('Test de déploiement · Grind up')
  })

  test('dans l’espace admin aussi, jusqu’au titre d’une quête', async ({ page }) => {
    await signUpAdmin(page, uniquePseudo('Coach'))
    await expect(page).toHaveTitle('Vue d’ensemble · Grind up')
    const title = `Tables ${uniquePseudo('q')}`
    const quest = await publishQuest(page, {
      title,
      items: [{ prompt: '2 + 2 ?', answers: ['4'] }],
    })

    await openAdminScreen(page, 'Quêtes')
    await expect(page).toHaveTitle('Quêtes · Grind up')
    await page.goto(`/admin/quetes/${quest.id}`)
    await expect(page).toHaveTitle(`${title} · Grind up`)
    await openAdminScreen(page, 'Paramètres')
    await expect(page).toHaveTitle('Paramètres · Grind up')
  })

  test('changer d’écran ramène en haut de la page ; « Retour » retrouve l’endroit quitté', async ({
    page,
  }) => {
    await signUpStudent(page, uniquePseudo('Lina'))
    await openStudentScreen(page, 'Profil')
    await expect(page.getByRole('heading', { level: 1, name: 'Profil' })).toBeVisible()
    // Tout en bas du profil, là où se trouve la déconnexion.
    await page.getByRole('button', { name: 'Se déconnecter' }).scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const left = await page.evaluate(() => window.scrollY)
    expect(left).toBeGreaterThan(200)

    await openStudentScreen(page, 'Mes quêtes')
    await expect(page.getByRole('heading', { level: 1, name: 'Mes quêtes' })).toBeVisible()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)

    await page.goBack()
    await expect(page.getByRole('heading', { level: 1, name: 'Profil' })).toBeVisible()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200)
  })

  test('changer d’onglet dans une page ne la fait pas remonter', async ({ page }) => {
    await signUpAdmin(page, uniquePseudo('Coach'))
    await openAdminScreen(page, 'Bots')
    await expect(page.getByRole('heading', { name: 'Classement' })).toBeVisible()
    await expect(page.getByText('Classé par missions accomplies.')).toBeVisible()
    await expect(page.getByText('Chargement du classement…')).toHaveCount(0)
    // Un écran bas : la page défile, même quand le classement est encore court.
    await page.setViewportSize({ width: page.viewportSize()!.width, height: 420 })
    const month = page.getByRole('link', { name: 'Ce mois' })
    // La page a défilé jusqu'au classement : ses onglets sont en haut de l'écran.
    await month.evaluate((tab) =>
      window.scrollTo(0, tab.getBoundingClientRect().top + window.scrollY - 150),
    )
    const before = await page.evaluate(() => window.scrollY)
    expect(before).toBeGreaterThan(0)

    await month.click()
    await expect(month).toHaveAttribute('aria-current', 'page')
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
    await expect(page.getByText('Chargement du classement…')).toHaveCount(0)
    expect(await page.evaluate(() => window.scrollY)).toBe(before)
  })

  test('au clavier, un lien d’évitement mène droit au contenu', async ({ page }) => {
    test.skip(isPhone(page), 'navigation au clavier : sur ordinateur')
    await signUpStudent(page, uniquePseudo('Lina'))
    await page.goto('/profil')
    await expect(page.getByRole('heading', { level: 1, name: 'Profil' })).toBeVisible()

    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Aller au contenu' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeInViewport()
    await page.keyboard.press('Enter')
    await expect(page.locator('main')).toBeFocused()

    // La tabulation suivante entre dans le contenu, sans repasser par la navigation.
    await page.keyboard.press('Tab')
    const inMain = await page.evaluate(
      () => document.querySelector('main')?.contains(document.activeElement) ?? false,
    )
    expect(inMain).toBe(true)
  })
})
