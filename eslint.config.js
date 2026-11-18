import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    'dist',
    '.netlify',
    'coverage',
    'playwright-report',
    'test-results',
    '.claude/worktrees',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    // Interface : code exécuté dans le navigateur.
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    // Serveur, scripts, tests et configuration : code exécuté par Node.
    files: ['server/**', 'netlify/**', 'scripts/**', 'dev/**', 'tests/**', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
])
