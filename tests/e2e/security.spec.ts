import { expect, test, type Page } from '@playwright/test'
import { openAdminScreen, signUpAdmin, signUpStudent, uniquePseudo } from './helpers'

/** Relève ce que le navigateur signale : erreurs de script et contenus bloqués. */
function watchForProblems(page: Page): string[] {
  const problems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text())
  })
  page.on('pageerror', (error) => problems.push(error.message))
  return problems
}

test.describe('politique de sécurité du contenu', () => {
  test('la page publiée n’autorise que les scripts, styles et appels du site', async ({ page }) => {
    await page.goto('/connexion')

    const policy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content')

    expect(policy).toContain("default-src 'self'")
    expect(policy).toContain("script-src 'self'")
    expect(policy).toContain("connect-src 'self'")
    expect(policy).toContain("object-src 'none'")
    expect(policy).not.toContain('unsafe-inline')
    expect(policy).not.toContain('unsafe-eval')
  })

  test('les écrans de l’élève s’affichent sans rien enfreindre', async ({ page }) => {
    const problems = watchForProblems(page)

    await signUpStudent(page, uniquePseudo('Csp'))
    for (const label of ['Mes quêtes', 'Leaderboard', 'Profil', 'Tableau de bord']) {
      await page.getByRole('navigation').getByRole('link', { name: label }).click()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    }

    expect(problems).toEqual([])
  })

  test('les écrans de l’admin s’affichent sans rien enfreindre', async ({ page }) => {
    const problems = watchForProblems(page)

    await signUpAdmin(page, uniquePseudo('Csp'))
    for (const label of ['Élèves', 'Quêtes', 'Validations', 'Bots', 'Paramètres']) {
      await openAdminScreen(page, label)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    }

    expect(problems).toEqual([])
  })

  test('un script glissé dans la page n’est pas exécuté', async ({ page }) => {
    await page.goto('/connexion')
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()

    const executed = await page.evaluate(() => {
      const script = document.createElement('script')
      script.textContent = 'window.__injected = true'
      document.head.append(script)
      return (window as unknown as { __injected?: boolean }).__injected === true
    })

    expect(executed).toBe(false)
  })
})
