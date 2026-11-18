import { UNKNOWN } from './families.js'
import {
  ACCENT,
  angleMark,
  arrow,
  dashed,
  defineFigure,
  drawing,
  type Drawing,
  type FigureDefinition,
  GREY,
  INK,
  type Part,
  PASTEL,
  type Point,
  polar,
  polygon,
  path,
  rect,
  segment,
  shifted,
  text,
  textWidth,
  WHITE,
} from './svg.js'

/**
 * Illustrations du thème « Algorithmique ». Une figure par entrée, construite avec les
 * familles de families.ts ou les primitives de svg.ts : voir docs/bibliotheque.md,
 * « Illustrer un exercice ».
 */

// ---------------------------------------------------------------------------
// Programmes de calcul

/**
 * Programme de calcul en ligne : des boîtes reliées par des flèches légendées,
 * plus serrées que chainFigure pour que quatre boîtes tiennent sur une ligne.
 * `backward` fait aller les flèches de droite à gauche : on remonte le programme.
 */
function rowChain(
  values: readonly string[],
  operations: readonly string[],
  { backward = false } = {},
): Drawing {
  const boxWidth = (value: string) => Math.max(40, textWidth(value, 15, 700) + 18)
  const arrowWidth = (operation: string) => Math.max(40, textWidth(operation, 14, 700) + 12)
  const total =
    values.reduce((sum, value) => sum + boxWidth(value), 0) +
    operations.reduce((sum, operation) => sum + arrowWidth(operation), 0)
  const boxHeight = 38
  const y = 52
  let x = (320 - total) / 2
  const parts: Part[] = []
  values.forEach((value, index) => {
    const width = boxWidth(value)
    const unknown = value === UNKNOWN
    parts.push(
      rect([x, y], width, boxHeight, {
        fill: unknown ? WHITE : PASTEL.citron,
        color: unknown ? ACCENT : INK,
        radius: 10,
      }),
      text([x + width / 2, y + boxHeight / 2], value, {
        weight: 700,
        color: unknown ? ACCENT : INK,
        halo: false,
      }),
    )
    x += width
    const operation = operations[index]
    if (operation === undefined) return
    const room = arrowWidth(operation)
    const a: Point = [x + 4, y + boxHeight / 2]
    const b: Point = [x + room - 4, y + boxHeight / 2]
    parts.push(
      backward
        ? arrow(b, a, { color: ACCENT, width: 1.75, head: 8 })
        : arrow(a, b, { color: GREY, width: 1.75, head: 8 }),
      text([x + room / 2, y - 12], operation, {
        size: 14,
        weight: 700,
        color: backward ? ACCENT : INK,
      }),
    )
    x += room
  })
  return drawing(120, ...parts)
}

/** Le programme de l'exemple, à l'endroit puis remonté à l'envers par les opérations inverses. */
function remonter() {
  return drawing(
    236,
    text([14, 16], 'Appliquer le programme', {
      size: 14,
      weight: 700,
      color: GREY,
      anchor: 'start',
    }),
    shifted(rowChain(['7', '28', '23'], ['× 4', '− 5']), 0, 0),
    text([14, 124], 'Le remonter', { size: 14, weight: 700, color: ACCENT, anchor: 'start' }),
    shifted(rowChain(['7', '28', '23'], ['÷ 4', '+ 5'], { backward: true }), 0, 108),
    text([160, 220], 'on défait la dernière instruction en premier', { size: 13, color: GREY }),
  )
}

const remonterFigure = defineFigure('programmes-calcul-remonter', remonter())

/** Une chaîne de programme de calcul, sur une ligne. */
const chain = (id: string, values: readonly string[], operations: readonly string[]) =>
  defineFigure(id, rowChain(values, operations))

const exempleChaine = chain(
  'programmes-calcul-exemple',
  ['5', '8', '16', '6'],
  ['+ 3', '× 2', '− 2 × 5'],
)
const q1Chaine = chain('programmes-calcul-q1', ['4', '…', '…', UNKNOWN], ['+ 6', '× 3', '− 10'])
const q2Chaine = chain(
  'programmes-calcul-q2',
  ['−3', '…', '…', UNKNOWN],
  ['au carré', '− 10', '× 2'],
)
const q3Chaine = chain('programmes-calcul-q3', ['x', '…', '…', UNKNOWN], ['+ 5', '× 4', '− 8'])
const q4Chaine = chain('programmes-calcul-q4', [UNKNOWN, '…', '…', '15'], ['× 3', '− 9', '÷ 2'])

/** Deux programmes appliqués au même nombre de départ, l'un sous l'autre. */
function twoPrograms(a: Drawing, b: Drawing, caption: string, height = 250): Drawing {
  return drawing(
    height,
    text([14, 18], 'Programme A', { size: 14, weight: 700, color: GREY, anchor: 'start' }),
    shifted(a, 0, 12),
    text([14, 126], 'Programme B', { size: 14, weight: 700, color: GREY, anchor: 'start' }),
    shifted(b, 0, 120),
    text([160, height - 14], caption, { size: 14, weight: 700, color: ACCENT }),
  )
}

const q5Programmes = defineFigure(
  'programmes-calcul-q5',
  twoPrograms(
    rowChain([UNKNOWN, '…', 'A'], ['× 4', '− 6']),
    rowChain([UNKNOWN, '…', 'B'], ['× 2', '+ 4']),
    'même résultat pour quel départ ?',
  ),
)

const q6Programmes = defineFigure(
  'programmes-calcul-q6',
  twoPrograms(
    rowChain(['x', '…', 'A'], ['+ 3', 'au carré']),
    rowChain(['x', '…', '…', 'B'], ['+ 6', '× départ', '+ 9']),
    'A et B égaux : pour quels nombres ?',
  ),
)

// ---------------------------------------------------------------------------
// Scripts en blocs, à la manière de Scratch

/** Couleur d'un bloc selon sa catégorie, comme dans Scratch (dans la palette de l'application). */
const CATEGORY = {
  variable: PASTEL.peche,
  control: PASTEL.citron,
  motion: PASTEL.ciel,
  looks: PASTEL.lilas,
  sensing: PASTEL.menthe,
} as const
type Category = keyof typeof CATEGORY

type Block =
  | { text: string; kind: Category }
  | { loop: string; body: readonly Block[] }
  | { condition: string; then: readonly Block[]; otherwise: readonly Block[] }

const BLOCK_HEIGHT = 26
const ARM = 16
const FOOT = 14
const SIZE = 14
const NOTCH = 12

/** Le contour d'un bloc : l'encoche en haut et le tenon en bas, qui s'emboîtent. */
function notchTop(x: number) {
  return `H ${x + NOTCH} l 4 4 l 12 0 l 4 -4`
}
function notchBottom(x: number) {
  return `H ${x + NOTCH + 20} l -4 4 l -12 0 l -4 -4`
}

const blockWidth = (content: string) => textWidth(content, SIZE, 600) * 1.12 + 26

/** Hauteur d'une pile de blocs. */
function stackHeight(blocks: readonly Block[]): number {
  return blocks.reduce((total, block) => {
    if ('text' in block) return total + BLOCK_HEIGHT
    if ('loop' in block) return total + BLOCK_HEIGHT + stackHeight(block.body) + FOOT
    return total + 2 * BLOCK_HEIGHT + stackHeight(block.then) + stackHeight(block.otherwise) + FOOT
  }, 0)
}

/** Largeur d'une pile de blocs. */
function stackWidth(blocks: readonly Block[]): number {
  return Math.max(
    0,
    ...blocks.map((block) => {
      if ('text' in block) return blockWidth(block.text)
      if ('loop' in block) return Math.max(blockWidth(block.loop), ARM + stackWidth(block.body) + 8)
      return Math.max(
        blockWidth(`si ${block.condition} alors`),
        ARM + stackWidth(block.then) + 8,
        ARM + stackWidth(block.otherwise) + 8,
      )
    }),
  )
}

/** Dessine une pile de blocs à partir du coin haut gauche `at`. */
function stack(blocks: readonly Block[], at: Point): Part[] {
  const parts: Part[] = []
  const x = at[0]
  let y = at[1]
  const label = (content: string, top: number) =>
    text([x + 10, top + BLOCK_HEIGHT / 2], content, {
      size: SIZE,
      weight: 600,
      anchor: 'start',
      halo: false,
    })
  const style = (fill: string) => ({ fill, color: GREY, width: 1.5 })
  for (const block of blocks) {
    if ('text' in block) {
      const w = blockWidth(block.text)
      parts.push(
        path(
          `M ${x} ${y} ${notchTop(x)} H ${x + w} V ${y + BLOCK_HEIGHT} ${notchBottom(x)} H ${x} Z`,
          style(CATEGORY[block.kind]),
        ),
        label(block.text, y),
      )
      y += BLOCK_HEIGHT
      continue
    }
    const w = Math.max(stackWidth([block]), 120)
    const inner = x + ARM
    if ('loop' in block) {
      const body = stackHeight(block.body)
      const armTop = y + BLOCK_HEIGHT
      const footTop = armTop + body
      parts.push(
        path(
          [
            `M ${x} ${y} ${notchTop(x)} H ${x + w} V ${armTop}`,
            `${notchBottom(inner)} H ${inner} V ${footTop}`,
            `${notchTop(inner)} H ${x + w} V ${footTop + FOOT} ${notchBottom(x)} H ${x} Z`,
          ].join(' '),
          style(CATEGORY.control),
        ),
        label(block.loop, y),
        ...stack(block.body, [inner, armTop]),
      )
      y = footTop + FOOT
      continue
    }
    const thenTop = y + BLOCK_HEIGHT
    const elseTop = thenTop + stackHeight(block.then)
    const secondArm = elseTop + BLOCK_HEIGHT
    const footTop = secondArm + stackHeight(block.otherwise)
    parts.push(
      path(
        [
          `M ${x} ${y} ${notchTop(x)} H ${x + w} V ${thenTop}`,
          `${notchBottom(inner)} H ${inner} V ${elseTop}`,
          `${notchTop(inner)} H ${x + w} V ${secondArm}`,
          `${notchBottom(inner)} H ${inner} V ${footTop}`,
          `${notchTop(inner)} H ${x + w} V ${footTop + FOOT} ${notchBottom(x)} H ${x} Z`,
        ].join(' '),
        style(CATEGORY.control),
      ),
      label(`si ${block.condition} alors`, y),
      label('sinon', elseTop),
      ...stack(block.then, [inner, thenTop]),
      ...stack(block.otherwise, [inner, secondArm]),
    )
    y = footTop + FOOT
  }
  return parts
}

/** Un script entier, centré, avec sa hauteur. */
function script(blocks: readonly Block[], { left }: { left?: number } = {}): Drawing {
  const width = stackWidth(blocks)
  const x = left ?? Math.round((320 - width) / 2)
  return drawing(Math.max(120, stackHeight(blocks) + 22), ...stack(blocks, [x, 10]))
}

const cmd = (content: string, kind: Category): Block => ({ text: content, kind })
const loop = (content: string, ...body: Block[]): Block => ({ loop: content, body })

/** La variable, une boîte qui porte un nom : ce que font « mettre » et « ajouter ». */
function variableBox() {
  const box = (at: Point, value: string) =>
    [
      text([at[0], at[1] - 32], 'score', { size: 14, weight: 700, color: GREY }),
      rect([at[0] - 30, at[1] - 20], 60, 40, { fill: WHITE, color: ACCENT, radius: 8 }),
      text(at, value, { size: 18, weight: 700, color: ACCENT, halo: false }),
    ].join('')
  const first = stack([cmd('mettre score à 10', 'variable')], [10, 22])
  const second = stack([cmd('ajouter 3 à score', 'variable')], [10, 96])
  return drawing(
    150,
    ...first,
    arrow([174, 36], [224, 36], { color: GREY, width: 1.75, head: 8 }),
    box([270, 44], '10'),
    ...second,
    arrow([174, 110], [224, 110], { color: GREY, width: 1.75, head: 8 }),
    box([270, 118], '13'),
  )
}

const variableFigure = defineFigure('scripts-variable-boite', variableBox())

/** L'angle dont tourne le lutin : l'angle extérieur, et non l'angle de la figure. */
function angleExterieur() {
  const a: Point = [20, 160]
  const corner: Point = [150, 160]
  const next = polar(corner, 112, 60)
  const ahead = polar(corner, 110, 0)
  return drawing(
    196,
    segment(a, corner, { width: 3 }),
    segment(corner, next, { width: 3 }),
    dashed(corner, ahead, { width: 1.5 }),
    arrow(a, [90, 160], { color: INK, width: 3, head: 11 }),
    angleMark(corner, ahead, next, { radius: 34, color: ACCENT }),
    angleMark(corner, a, next, { radius: 22, color: GREY }),
    text([56, 178], 'le lutin avance', { size: 13, color: GREY }),
    text([120, 112], 'angle de', { size: 14, weight: 700, color: GREY, anchor: 'end' }),
    text([120, 130], 'la figure', { size: 14, weight: 700, color: GREY, anchor: 'end' }),
    text([206, 120], 'il tourne', { size: 14, weight: 700, color: ACCENT, anchor: 'start' }),
    text([206, 138], 'de cet angle', { size: 14, weight: 700, color: ACCENT, anchor: 'start' }),
    text([258, 178], 'tout droit', { size: 13, color: GREY, anchor: 'end' }),
  )
}

const angleFigure = defineFigure('scripts-angle-exterieur', angleExterieur())

const exempleCondition = defineFigure(
  'scripts-exemple-condition',
  script([
    cmd('mettre n à 2', 'variable'),
    loop('répéter 4 fois', cmd('ajouter 3 à n', 'variable')),
    {
      condition: 'n > 12',
      then: [cmd('dire Grand', 'looks')],
      otherwise: [cmd('dire Petit', 'looks')],
    },
  ]),
)

/** L'exemple du carré : le script à gauche, le tracé du lutin à droite. */
function exempleCarre() {
  const blocks = script(
    [
      loop(
        'répéter 4 fois',
        cmd('avancer de 50 pas', 'motion'),
        cmd('tourner ↻ de 90 degrés', 'motion'),
      ),
    ],
    { left: 10 },
  )
  const side = 56
  const left = 254
  const top = 26
  const corners: Point[] = [
    [left, top + side],
    [left, top],
    [left + side, top],
    [left + side, top + side],
  ]
  return drawing(
    Math.max(blocks.height, 130),
    ...blocks.parts,
    polygon(corners, { color: ACCENT, width: 2.5 }),
    // Le lutin, au départ, tourné vers le haut.
    polygon(
      [
        [left, top + side - 16],
        [left - 8, top + side + 4],
        [left + 8, top + side + 4],
      ],
      { fill: ACCENT, color: ACCENT, width: 1.5 },
    ),
    text([312, top + side + 22], 'côté : 50 pas', { size: 13, color: GREY, anchor: 'end' }),
  )
}

const exempleCarreFigure = defineFigure('scripts-exemple-carre', exempleCarre())

const q1Script = defineFigure(
  'scripts-q1-boucle',
  script([
    cmd('mettre n à 5', 'variable'),
    loop('répéter 3 fois', cmd('ajouter 4 à n', 'variable')),
  ]),
)

const q2Script = defineFigure(
  'scripts-q2-condition',
  script([
    cmd('demander un nombre et attendre', 'sensing'),
    cmd('mettre n à réponse', 'variable'),
    cmd('multiplier n par 2', 'variable'),
    cmd('ajouter 4 à n', 'variable'),
    {
      condition: 'n > 20',
      then: [cmd('dire Gagné', 'looks')],
      otherwise: [cmd('dire Perdu', 'looks')],
    },
  ]),
)

const q3Script = defineFigure(
  'scripts-q3-boucles-imbriquees',
  script([
    cmd('mettre n à 0', 'variable'),
    loop('répéter 3 fois', loop('répéter 4 fois', cmd('ajouter 2 à n', 'variable'))),
  ]),
)

const q4Script = defineFigure(
  'scripts-q4-figure',
  script([
    loop(
      'répéter 3 fois',
      cmd('avancer de 80 pas', 'motion'),
      cmd('tourner ↺ de 120 degrés', 'motion'),
    ),
  ]),
)

const q5Script = defineFigure(
  'scripts-q5-distance',
  script([
    loop(
      'répéter 2 fois',
      cmd('avancer de 120 pas', 'motion'),
      cmd('tourner ↻ de 90 degrés', 'motion'),
      cmd('avancer de 70 pas', 'motion'),
      cmd('tourner ↻ de 90 degrés', 'motion'),
    ),
  ]),
)

const q6Script = defineFigure(
  'scripts-q6-jusqua',
  script([
    cmd('mettre total à 20', 'variable'),
    cmd('mettre semaines à 0', 'variable'),
    loop(
      'répéter jusqu’à ce que total > 100',
      cmd('ajouter 15 à total', 'variable'),
      cmd('ajouter 1 à semaines', 'variable'),
    ),
    cmd('dire semaines', 'looks'),
  ]),
)

export const algorithmiqueFigures: readonly FigureDefinition[] = [
  remonterFigure,
  exempleChaine,
  q1Chaine,
  q2Chaine,
  q3Chaine,
  q4Chaine,
  q5Programmes,
  q6Programmes,
  variableFigure,
  angleFigure,
  exempleCondition,
  exempleCarreFigure,
  q1Script,
  q2Script,
  q3Script,
  q4Script,
  q5Script,
  q6Script,
]
