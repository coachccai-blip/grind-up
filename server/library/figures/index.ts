import { algorithmiqueFigures } from './algorithmique.js'
import { calculLitteralFigures } from './calcul-litteral.js'
import { donneesFigures } from './donnees.js'
import { equationsFigures } from './equations.js'
import { espaceFigures } from './espace.js'
import { fonctionsFigures } from './fonctions.js'
import { geometrieFigures } from './geometrie.js'
import { modelesFigures } from './modeles.js'
import { nombresFigures } from './nombres.js'
import { proportionnaliteFigures } from './proportionnalite.js'
import type { FigureDefinition } from './svg.js'

/**
 * Toutes les illustrations de la bibliothèque. Chacune devient le fichier
 * public/figures/<id>.svg, enregistré dans le dépôt et réengendré par le test
 * tests/unit/library-figures.test.ts :
 *
 *   MAJ_FIGURES=1 npx vitest run tests/unit/library-figures.test.ts
 *
 * Ce dossier n'est jamais importé par le code du serveur : les exercices ne
 * contiennent que la ligne qui désigne une figure. On ajoute une figure dans le
 * fichier de son thème, jamais ici.
 */
export const FIGURES: readonly FigureDefinition[] = [
  ...nombresFigures,
  ...calculLitteralFigures,
  ...equationsFigures,
  ...fonctionsFigures,
  ...proportionnaliteFigures,
  ...donneesFigures,
  ...geometrieFigures,
  ...espaceFigures,
  ...algorithmiqueFigures,
  ...modelesFigures,
]
