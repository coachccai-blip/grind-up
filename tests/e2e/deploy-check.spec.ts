import { expect, test, type Page } from '@playwright/test'

/** Numéro de la dernière écriture affichée par la page (« Écriture n° 3 enregistrée »). */
async function shownWriteNumber(page: Page): Promise<number> {
  // Pendant qu'un test tourne, la ligne n'est pas affichée : on renvoie alors 0.
  const detail = page.getByText(/Écriture n° \d+ enregistrée/)
  if ((await detail.count()) === 0) return 0
  return Number((await detail.textContent())?.match(/n° (\d+)/)?.[1] ?? 0)
}

test.describe('test de déploiement', () => {
  test('la page confirme que la fonction lit et écrit dans la base', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1, name: 'Grind up' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Test réussi' })).toBeVisible()
    await expect(
      page.getByText('Tout fonctionne : la fonction lit et écrit dans la base.'),
    ).toBeVisible()

    // Chaque vérification est listée avec son libellé et son résultat.
    const checks = page.getByRole('listitem')
    await expect(checks).toHaveCount(7)
    for (const label of [
      'Affichage de la page',
      'Appel de la fonction serveur',
      'Fonction serveur',
      'Écriture dans la base',
      'Relecture depuis le stockage',
      'Protection contre les écritures concurrentes',
      'Copie quotidienne de la base',
    ]) {
      const check = checks.filter({ has: page.getByText(label, { exact: true }) })
      await expect(check.getByText('Réussi')).toBeVisible()
    }
  })

  test('relancer le test enregistre une nouvelle écriture', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Test réussi' })).toBeVisible()
    const before = await shownWriteNumber(page)

    await page.getByRole('button', { name: 'Relancer le test' }).click()

    // Le compteur d'écritures vit dans la base : il ne peut qu'augmenter.
    await expect.poll(() => shownWriteNumber(page)).toBeGreaterThan(before)
    await expect(page.getByRole('heading', { name: 'Test réussi' })).toBeVisible()
  })

  test('signale clairement une fonction serveur absente', async ({ page }) => {
    // Sans fonction publiée, Netlify renvoie la page du site à la place de l'API.
    await page.route('**/api/sante', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>x</title>',
      }),
    )

    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Test en échec' })).toBeVisible()
    const apiCheck = page.getByRole('listitem').filter({ hasText: 'Appel de la fonction serveur' })
    await expect(apiCheck.getByText('Échec')).toBeVisible()
    await expect(apiCheck).toContainText("La fonction serveur n'est pas publiée")
  })

  test('affiche le détail renvoyé quand une vérification échoue', async ({ page }) => {
    await page.route('**/api/sante', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          message: 'Le test a échoué : voir le détail des vérifications.',
          version: '0.1.0',
          checkedAt: '2026-11-17T10:00:00.000Z',
          checks: [
            {
              id: 'function',
              label: 'Fonction serveur',
              ok: true,
              detail: 'Node v22',
              durationMs: 0,
            },
            {
              id: 'database_write',
              label: 'Écriture dans la base',
              ok: false,
              detail: 'Error : stockage indisponible',
              durationMs: 12,
            },
          ],
        }),
      }),
    )

    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Test en échec' })).toBeVisible()
    const writeCheck = page.getByRole('listitem').filter({ hasText: 'Écriture dans la base' })
    await expect(writeCheck.getByText('Échec')).toBeVisible()
    await expect(writeCheck).toContainText('stockage indisponible')
  })

  test("tient dans la largeur de l'écran, sans défilement horizontal", async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Test réussi' })).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)

    // Zones tactiles d'au moins 44 px de haut.
    for (const name of ['Relancer le test', 'Copier le détail']) {
      const box = await page.getByRole('button', { name }).boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
    }
  })

  test("l'API répond en JSON, y compris pour une adresse inconnue", async ({ request }) => {
    const health = await request.get('/api/sante')
    expect(health.status()).toBe(200)
    expect(health.headers()['content-type']).toContain('application/json')
    expect((await health.json()).ok).toBe(true)

    const unknown = await request.get('/api/inconnue')
    expect(unknown.status()).toBe(404)
    expect(await unknown.json()).toEqual({
      error: { code: 'not_found', message: "Cette adresse n'existe pas." },
    })
  })

  test("une adresse inconnue du site renvoie l'interface", async ({ page }) => {
    await page.goto('/une/adresse/inconnue')

    await expect(page.getByRole('heading', { level: 1, name: 'Grind up' })).toBeVisible()
  })
})
