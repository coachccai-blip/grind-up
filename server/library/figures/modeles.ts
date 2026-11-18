import { planeFigure, polygonFigure, UNKNOWN } from './families.js'
import { defineFigure, type FigureDefinition, withUnit } from './svg.js'

/**
 * Figures modèles, branchées sur aucun exercice : elles montrent aux auteurs
 * comment dessiner les cas les plus courants. À recopier dans le fichier de son
 * thème, avec un autre identifiant.
 */

/** Un triangle rectangle étiqueté, dont on cherche l'hypoténuse. */
const triangleRectangle = defineFigure(
  'modele-triangle-rectangle',
  polygonFigure({
    height: 200,
    vertices: [
      { name: 'A', at: [70, 30] },
      { name: 'B', at: [70, 166] },
      { name: 'C', at: [262, 166] },
    ],
    rightAngles: ['B'],
    sides: [
      { from: 'A', to: 'B', label: withUnit(6, 'cm') },
      { from: 'B', to: 'C', label: withUnit(8, 'cm') },
      { from: 'C', to: 'A', label: UNKNOWN },
    ],
  }),
)

/** La droite d'une fonction affine dans un repère, avec deux points lus sur le graphique. */
const fonctionAffine = defineFigure(
  'modele-fonction-affine',
  planeFigure({
    x: [-2, 6],
    y: [-2, 4],
    unit: 34,
    lines: [{ f: (x) => 0.5 * x + 1, name: 'f' }],
    points: [
      { x: 0, y: 1, name: 'A', angle: -40 },
      { x: 4, y: 3, name: 'B', guides: true, angle: 120 },
    ],
  }),
)

export const modelesFigures: readonly FigureDefinition[] = [triangleRectangle, fonctionAffine]
