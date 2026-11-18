import { expect, type Page } from '@playwright/test'

export const PASSWORD = 'motdepasse-solide'
export const ADMIN_PASSWORD = 'motdepasse-admin'

let counter = 0

/** Pseudo unique, valide (lettres et chiffres) et de 20 caractères au plus. */
export function uniquePseudo(prefix: string): string {
  counter += 1
  return `${prefix}${Date.now().toString(36).slice(-6)}${counter.toString(36)}`
}

export const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 1024

/**
 * Inscrit un élève par l'interface, confirme l'écran de bienvenue et renvoie son
 * identifiant XXXX-XXXX. L'élève se retrouve sur son tableau de bord.
 */
export async function signUpStudent(page: Page, pseudo: string): Promise<string> {
  await page.goto('/inscription')
  await page.getByLabel('Pseudo').fill(pseudo)
  await page.getByLabel('Mot de passe').fill(PASSWORD)
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page.getByRole('heading', { name: `Bienvenue, ${pseudo}` })).toBeVisible()
  const identifier = await page.getByText(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/).textContent()
  await page.getByRole('button', { name: 'C’est noté, continuer' }).click()
  await expect(page.getByRole('heading', { name: `Bonjour, ${pseudo}` })).toBeVisible()
  return identifier ?? ''
}

/** Inscrit un admin par l'interface, avec le code spécial. */
export async function signUpAdmin(page: Page, pseudo: string): Promise<void> {
  await page.goto('/inscription')
  await page.getByLabel('Pseudo').fill(pseudo)
  await page.getByLabel('Mot de passe').fill(ADMIN_PASSWORD)
  await page.getByText('J’ai un code spécial').click()
  await page.getByLabel('Code spécial').fill('SuperAdmin')
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page.getByRole('heading', { name: 'Vue d’ensemble' })).toBeVisible()
}

export async function logIn(page: Page, login: string, password: string): Promise<void> {
  await page.goto('/connexion')
  await page.getByLabel('Identifiant ou pseudo').fill(login)
  await page.getByLabel('Mot de passe').fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
}

/** Ouvre un écran de l'espace admin par son menu (replié sur téléphone). */
export async function openAdminScreen(page: Page, label: string): Promise<void> {
  if (isPhone(page)) await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('navigation').getByRole('link', { name: label }).click()
}

/** La page tient dans la largeur de l'écran, sans défilement horizontal. */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

/** Ouvre un écran de l'espace élève par sa barre de navigation. */
export async function openStudentScreen(page: Page, label: string): Promise<void> {
  await page.getByRole('navigation').getByRole('link', { name: label }).click()
}

/**
 * Crée et publie une quête par l'API, avec la session de l'admin connecté dans
 * cette page. Pour préparer un parcours sans repasser par le formulaire.
 */
export async function publishQuest(
  adminPage: Page,
  quest: Record<string, unknown>,
): Promise<{ id: string }> {
  const response = await adminPage.request.post('/api/admin/quests', {
    data: {
      instructions: '',
      category: 'maths',
      format: 'exact',
      difficulty: 'medium',
      rewardXp: 100,
      deadlineAt: null,
      items: [],
      assignees: 'all',
      publish: true,
      ...quest,
    },
  })
  expect(response.status(), await response.text()).toBe(201)
  return ((await response.json()) as { quest: { id: string } }).quest
}
