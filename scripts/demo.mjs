// Données de démonstration : `npm run demo` remplit la base locale (celle de
// `npm run dev`) avec 1 admin, 6 élèves, 3 bots et 10 quêtes couvrant tous les
// formats, et trois semaines d'activité. La base doit être vide.
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Un serveur Vite sans page ni port : il ne sert qu'à charger le code TypeScript du serveur.
const loader = await createServer({
  root,
  configFile: false,
  appType: 'custom',
  logLevel: 'warn',
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true },
})

try {
  const { installDemo } = await loader.ssrLoadModule('/dev/demo.ts')
  const demo = await installDemo(root)
  console.log(
    [
      'Données de démonstration installées dans la base locale.',
      '',
      `  Admin        : ${demo.admin}`,
      `  Élèves       : ${demo.students.join(', ')}`,
      `  Bots         : ${demo.bots.join(', ')}`,
      `  Quêtes       : ${demo.quests}`,
      `  Mot de passe : ${demo.password} (le même pour tous les comptes)`,
      '',
      'Lancer « npm run dev », puis se connecter sur http://localhost:5173 avec un de ces pseudos.',
    ].join('\n'),
  )
} catch (error) {
  // Une base déjà remplie, ou toute autre erreur : rien n'a été écrit.
  console.error(error instanceof Error ? error.message : error)
  if (error instanceof Error && error.name === 'DemoError') {
    console.error(
      'Pour repartir de zéro : arrêter « npm run dev », supprimer le dossier .netlify/blobs-local, puis relancer « npm run demo ».',
    )
  }
  process.exitCode = 1
} finally {
  await loader.close()
}
