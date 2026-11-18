import { defineConfig, devices } from '@playwright/test'

/**
 * Tests de bout en bout : un vrai navigateur parcourt le site servi en local,
 * avec la fonction serveur et le stockage émulés comme sur Netlify.
 * Chaque parcours est joué sur téléphone (360 px de large) et sur ordinateur.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  // Le premier appel réveille la fonction : on laisse le temps au test de déploiement de répondre.
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:5173',
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
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
