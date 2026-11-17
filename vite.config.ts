import react from '@vitejs/plugin-react'
import { defineConfig, type PluginOption } from 'vite'

/**
 * En développement, reproduit Netlify dans le serveur de Vite : fonctions sous /api/,
 * stockage Netlify Blobs local, règles de netlify.toml.
 *
 * Le module n'est chargé que pour `npm run dev` : c'est un outil de développement,
 * que Netlify n'installe pas quand il construit le site. Il se désactive de lui-même
 * quand le site est lancé par `netlify dev`, qui fait déjà ce travail.
 */
async function netlifyEmulation(): Promise<PluginOption> {
  // Nom passé par une variable : à la construction, Vite n'a pas à trouver ce module.
  const moduleName = '@netlify/vite-plugin'
  const { default: netlify } = (await import(moduleName)) as typeof import('@netlify/vite-plugin')
  return netlify({
    // Fonctionnalités de Netlify que ce projet n'utilise pas.
    edgeFunctions: { enabled: false },
    database: { enabled: false },
    images: { enabled: false },
  })
}

// Interface : application monopage compilée en fichiers statiques dans dist/.
export default defineConfig(async ({ command }) => ({
  plugins: [react(), command === 'serve' ? await netlifyEmulation() : null],
  server: {
    // Port fixe : `netlify dev` s'y connecte (voir netlify.toml).
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  },
}))
