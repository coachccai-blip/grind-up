import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { localNetlify } from './dev/local-netlify.js'

/**
 * Politique de sécurité du contenu, inscrite dans la page construite : le
 * navigateur n'exécute que les scripts du site et ne contacte que le site. Elle
 * n'est pas posée en développement, où Vite injecte ses propres scripts.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function contentSecurityPolicy(): Plugin {
  return {
    name: 'grind-up:content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
        injectTo: 'head-prepend',
      },
    ],
  }
}

// Interface : application monopage compilée en fichiers statiques dans dist/.
export default defineConfig({
  plugins: [react(), contentSecurityPolicy(), localNetlify()],
  server: {
    // Port fixe : `netlify dev` s'y connecte (voir netlify.toml).
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    // Le fichier principal pèse environ 510 Ko (156 Ko une fois compressé pour le transfert) :
    // React, le routeur et la validation des saisies. L'espace admin est déjà chargé à part.
    chunkSizeWarningLimit: 600,
  },
})
