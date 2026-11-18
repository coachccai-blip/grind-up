import { expect, test } from '@playwright/test'
import { openAdminScreen, signUpAdmin, signUpStudent, uniquePseudo } from './helpers'

/**
 * Installation sur l'écran d'accueil (section 11 du brief) : un manifeste web et
 * des icônes, sans passer par les magasins d'applications.
 */
test.describe('installation sur l’écran d’accueil', () => {
  test('le navigateur reconnaît une application installable', async ({ page }) => {
    await page.goto('/connexion')
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      '/manifest.webmanifest',
    )

    // Chromium dit lui-même ce qu'il pense du manifeste et de ses icônes.
    const browser = await page.context().newCDPSession(page)
    const manifest = await browser.send('Page.getAppManifest')
    expect(manifest.errors).toEqual([])
    expect(JSON.parse(manifest.data ?? '{}')).toMatchObject({
      name: 'Grind up',
      display: 'standalone',
      start_url: '/',
    })
    const { installabilityErrors } = await browser.send('Page.getInstallabilityErrors')
    expect(installabilityErrors).toEqual([])
  })

  test('le manifeste et les icônes sont servis par le site, sous leur vrai type', async ({
    request,
  }) => {
    const manifest = await request.get('/manifest.webmanifest')
    expect(manifest.status()).toBe(200)
    expect(manifest.headers()['content-type']).toContain('application/manifest+json')

    const { icons } = (await manifest.json()) as { icons: { src: string }[] }
    for (const src of [...icons.map((icon) => icon.src), '/icons/apple-touch-icon.png']) {
      const icon = await request.get(src)
      expect(icon.status(), src).toBe(200)
      expect(icon.headers()['content-type'], src).toBe('image/png')
    }
  })

  test('le profil de l’élève et les paramètres de l’admin expliquent comment installer', async ({
    browser,
    page,
  }) => {
    await signUpStudent(page, uniquePseudo('Lina'))
    await page.getByRole('link', { name: 'Profil' }).click()
    const card = page.locator('section').filter({ hasText: 'Installer Grind up' })
    await expect(card.getByRole('heading', { name: 'Installer Grind up' })).toBeVisible()
    // L'élève est tutoyé ; sur ordinateur, l'installation passe par la barre d'adresse.
    await expect(card).toContainText('Ajoute Grind up à ton écran d’accueil')
    await expect(card).toContainText('clique sur l’icône d’installation')

    // Sur iPhone, c'est le bouton Partager.
    const iphone = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    })
    const phone = await iphone.newPage()
    await signUpStudent(phone, uniquePseudo('Lina'))
    await phone.getByRole('link', { name: 'Profil' }).click()
    await expect(phone.getByText('Touche le bouton Partager de ton navigateur')).toBeVisible()
    await iphone.close()

    // L'admin est vouvoyé.
    const adminContext = await browser.newContext({ viewport: page.viewportSize() })
    const admin = await adminContext.newPage()
    await signUpAdmin(admin, uniquePseudo('Coach'))
    await openAdminScreen(admin, 'Paramètres')
    await expect(admin.getByText('Ajoutez Grind up à votre écran d’accueil')).toBeVisible()
    await adminContext.close()
  })
})
