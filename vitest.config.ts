import { defineConfig } from 'vitest/config'

// Tests automatiques des règles et de l'API (sans navigateur).
// Le parcours dans le navigateur est testé à part par Playwright (tests/e2e).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/api/**/*.test.ts'],
  },
})
