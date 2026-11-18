import { defineConfig, devices } from '@playwright/test'

const PORT = 5180

/**
 * Tests de bout en bout : un vrai navigateur parcourt le site construit, servi
 * en local avec la fonction serveur et le stockage émulés comme sur Netlify.
 * Chaque parcours est joué sur téléphone (360 px de large) et sur ordinateur.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  // Les parcours sont indépendants : chacun crée ses propres comptes.
  fullyParallel: true,
  workers: 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  // Le premier appel réveille la fonction : on laisse le temps au test de déploiement de répondre.
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },
  projects: [
    {
      name: 'téléphone',
      use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 }, hasTouch: true },
    },
    {
      name: 'ordinateur',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    // Le site construit, servi sur un port réservé aux tests, avec une base neuve à chaque série.
    command: `npm run build && npm run preview -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { GRIND_UP_E2E_RUN: Date.now().toString(36) },
  },
})
