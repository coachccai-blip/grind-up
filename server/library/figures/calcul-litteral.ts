import {
  ACCENT,
  arrow,
  brace,
  defineFigure,
  drawing,
  type FigureDefinition,
  GREY,
  INK,
  type Part,
  PASTEL,
  type Point,
  polygon,
  rect,
  segment,
  text,
} from './svg.js'

/**
 * Illustrations du thème « Calcul littéral ». Une figure par entrée, construite
 * avec les familles de families.ts ou les primitives de svg.ts : voir
 * docs/bibliotheque.md, « Illustrer un exercice ».
 */

/** Étiquette d'une aire, au centre de sa surface. */
const area = (at: Point, label: string, color = INK) =>
  text(at, label, { size: 17, weight: 700, color, halo: false })

/** Étiquette d'une longueur, posée contre un côté. */
const side = (at: Point, label: string, anchor: 'start' | 'middle' | 'end' = 'middle') =>
  text(at, label, { weight: 700, color: GREY, anchor })

interface SquareSplit {
  /** Les deux longueurs qui composent le côté, en unités de dessin, et leur nom. */
  first: { size: number; name: string }
  second: { size: number; name: string }
  /** Les quatre aires : en haut à gauche, en haut à droite, en bas à gauche, en bas à droite. */
  areas: readonly [string, string, string, string]
  /** Le nom du côté entier, écrit sous l'accolade du bas et de droite. */
  whole: string
}

/**
 * Carré de côté a + b découpé en quatre : le carré a², deux rectangles ab et le
 * carré b². Le dessin montre d'où vient le double produit.
 */
function squareSplit({ first, second, areas, whole }: SquareSplit) {
  const sideLength = first.size + second.size
  const left = (320 - sideLength) / 2 - 8
  const top = 30
  const x1 = left + first.size
  const y1 = top + first.size
  const right = left + sideLength
  const bottom = top + sideLength
  return drawing(
    bottom + 44,
    rect([left, top], first.size, first.size, { fill: PASTEL.lilas, width: 0 }),
    rect([x1, top], second.size, first.size, { fill: PASTEL.peche, width: 0 }),
    rect([left, y1], first.size, second.size, { fill: PASTEL.peche, width: 0 }),
    rect([x1, y1], second.size, second.size, { fill: PASTEL.menthe, width: 0 }),
    rect([left, top], sideLength, sideLength),
    segment([x1, top], [x1, bottom]),
    segment([left, y1], [right, y1]),
    area([left + first.size / 2, top + first.size / 2], areas[0]),
    area([x1 + second.size / 2, top + first.size / 2], areas[1]),
    area([left + first.size / 2, y1 + second.size / 2], areas[2]),
    area([x1 + second.size / 2, y1 + second.size / 2], areas[3]),
    // Les deux morceaux du côté, en haut et à gauche…
    side([left + first.size / 2, top - 12], first.name),
    side([x1 + second.size / 2, top - 12], second.name),
    side([left - 10, top + first.size / 2], first.name, 'end'),
    side([left - 10, y1 + second.size / 2], second.name, 'end'),
    // … et le côté entier, en bas et à droite.
    brace([left, bottom], [right, bottom], whole, { outside: [left, top] }),
    brace([right, top], [right, bottom], whole, { outside: [left, top] }),
  )
}

const carreSomme = defineFigure(
  'carre-somme',
  squareSplit({
    first: { size: 104, name: 'a' },
    second: { size: 56, name: 'b' },
    areas: ['a²', 'ab', 'ab', 'b²'],
    whole: 'a + b',
  }),
)

/**
 * (2x)² = 4x² : le carré de côté 2x contient quatre carrés de côté x. Le carré
 * porte sur le coefficient comme sur la lettre.
 */
function carreDouble() {
  const half = 74
  const sideLength = 2 * half
  const left = (320 - sideLength) / 2 - 8
  const top = 30
  const right = left + sideLength
  const bottom = top + sideLength
  const cells: Part[] = [0, 1].flatMap((row) =>
    [0, 1].map((column) => {
      const at: Point = [left + column * half, top + row * half]
      return [
        rect(at, half, half, { fill: PASTEL.lilas, width: 0 }),
        area([at[0] + half / 2, at[1] + half / 2], 'x²'),
      ].join('')
    }),
  )
  return drawing(
    bottom + 44,
    ...cells,
    rect([left, top], sideLength, sideLength),
    segment([left + half, top], [left + half, bottom]),
    segment([left, top + half], [right, top + half]),
    side([left + half / 2, top - 12], 'x'),
    side([left + half * 1.5, top - 12], 'x'),
    side([left - 10, top + half / 2], 'x', 'end'),
    side([left - 10, top + half * 1.5], 'x', 'end'),
    brace([left, bottom], [right, bottom], '2x', { outside: [left, top] }),
    brace([right, top], [right, bottom], '2x', { outside: [left, top] }),
  )
}

const carreDeDeuxX = defineFigure('carre-de-2x', carreDouble())

/**
 * a² − b² = (a + b)(a − b) : on retire le carré b² du coin du carré a², puis
 * on pose la bande du bas, debout, contre le côté droit. On obtient un
 * rectangle de côtés a + b et a − b. La couleur suit la bande déplacée.
 *
 * Le carré d'une différence, (a − b)², n'a pas de figure : le dessin qui
 * l'explique (deux bandes ab qui se chevauchent) ne se lit pas d'un coup d'œil.
 */
function differenceCarres() {
  const a = 92
  const b = 34
  const top = 30
  const bottom = top + a
  const caption = bottom + 38
  // À gauche : le carré a² privé du carré b² de son coin.
  const left = 34
  const lower = bottom - b
  const notch: Part[] = [
    rect([left, top], a, a - b, { fill: PASTEL.lilas, width: 0 }),
    rect([left, lower], a - b, b, { fill: PASTEL.peche, width: 0 }),
    rect([left + a - b, lower], b, b, { color: GREY, dashed: true, width: 1.5 }),
    polygon([
      [left, top],
      [left + a, top],
      [left + a, lower],
      [left + a - b, lower],
      [left + a - b, bottom],
      [left, bottom],
    ]),
    segment([left, lower], [left + a - b, lower], { color: INK, width: 1.5, dashed: true }),
    side([left + a / 2, top - 12], 'a'),
    side([left - 10, top + a / 2], 'a', 'end'),
    side([left + a - b / 2, bottom + 12], 'b'),
    text([left + a / 2, caption], 'a² − b²', { weight: 700 }),
  ]
  // À droite : le rectangle de côtés a + b et a − b.
  const wide = a + b
  const tall = a - b
  const start = 306 - wide
  const rectTop = bottom - tall
  const rectangle: Part[] = [
    rect([start, rectTop], a, tall, { fill: PASTEL.lilas, width: 0 }),
    rect([start + a, rectTop], b, tall, { fill: PASTEL.peche, width: 0 }),
    rect([start, rectTop], wide, tall),
    segment([start + a, rectTop], [start + a, bottom], { color: INK, width: 1.5, dashed: true }),
    brace([start, rectTop], [start + wide, rectTop], 'a + b', { outside: [start, bottom] }),
    side([start - 10, rectTop + tall / 2], 'a − b', 'end'),
    text([start + wide / 2, caption], '(a + b)(a − b)', { weight: 700 }),
  ]
  return drawing(
    caption + 18,
    ...notch,
    ...rectangle,
    text([(left + a + start) / 2 + 6, caption], '=', { size: 17, weight: 700, color: ACCENT }),
  )
}

const differenceCarresFigure = defineFigure('difference-carres', differenceCarres())

/** Un rectangle découpé en cases : leurs largeurs, leurs hauteurs, leurs aires et leurs aplats. */
interface AreaGrid {
  columns: readonly { size: number; name: string }[]
  rows: readonly { size: number; name: string }[]
  /** Les aires, ligne par ligne. */
  areas: readonly (readonly string[])[]
  fills: readonly (readonly string[])[]
  left: number
  top: number
  /** Le nom du côté entier, sous l'accolade du bas ; rien si absent. */
  wholeWidth?: string
  /** Le nom du côté entier, à droite ; rien si absent. */
  wholeHeight?: string
  /** Couleur des noms des lignes (le facteur commun en accent). */
  rowColor?: string
  /** Séparations en pointillés, quand les morceaux ont été recollés. */
  dashedCuts?: boolean
}

/**
 * Le modèle des aires : un rectangle dont les côtés sont des sommes, découpé
 * en autant de rectangles que de produits. Même style que le carré a + b.
 */
function areaGrid(options: AreaGrid): Part[] {
  const { columns, rows, areas, fills, left, top, wholeWidth, wholeHeight } = options
  const rowColor = options.rowColor ?? GREY
  const width = columns.reduce((total, column) => total + column.size, 0)
  const height = rows.reduce((total, row) => total + row.size, 0)
  const xs = columns.map((_, index) =>
    columns.slice(0, index).reduce((total, column) => total + column.size, left),
  )
  const ys = rows.map((_, index) =>
    rows.slice(0, index).reduce((total, row) => total + row.size, top),
  )
  const cut = { color: INK, width: options.dashedCuts ? 1.5 : 2, dashed: options.dashedCuts }
  return [
    ...rows.flatMap((row, r) =>
      columns.flatMap((column, c) => [
        rect([xs[c]!, ys[r]!], column.size, row.size, { fill: fills[r]![c]!, width: 0 }),
        area([xs[c]! + column.size / 2, ys[r]! + row.size / 2], areas[r]![c]!),
      ]),
    ),
    rect([left, top], width, height),
    ...xs.slice(1).map((x) => segment([x, top], [x, top + height], cut)),
    ...ys.slice(1).map((y) => segment([left, y], [left + width, y], cut)),
    ...columns.map(
      (column, c) => column.name && side([xs[c]! + column.size / 2, top - 12], column.name),
    ),
    ...rows.map((row, r) =>
      text([left - 10, ys[r]! + row.size / 2], row.name, {
        weight: 700,
        color: rowColor,
        anchor: 'end',
      }),
    ),
    wholeWidth &&
      brace([left, top + height], [left + width, top + height], wholeWidth, {
        outside: [left, top],
      }),
    wholeHeight &&
      brace([left + width, top], [left + width, top + height], wholeHeight, {
        outside: [left, top],
      }),
  ]
}

/** Simple distributivité : le rectangle k × (a + b) se découpe en ka et kb. */
const distributiviteSimple = defineFigure(
  'distributivite-simple',
  drawing(
    146,
    ...areaGrid({
      columns: [
        { size: 132, name: 'a' },
        { size: 80, name: 'b' },
      ],
      rows: [{ size: 70, name: 'k' }],
      areas: [['ka', 'kb']],
      fills: [[PASTEL.lilas, PASTEL.peche]],
      left: 62,
      top: 30,
      wholeWidth: 'a + b',
    }),
  ),
)

/** Double distributivité : le rectangle (a + b)(c + d) se découpe en quatre. */
const distributiviteDouble = defineFigure(
  'distributivite-double',
  drawing(
    206,
    ...areaGrid({
      columns: [
        { size: 124, name: 'a' },
        { size: 72, name: 'b' },
      ],
      rows: [
        { size: 80, name: 'c' },
        { size: 52, name: 'd' },
      ],
      areas: [
        ['ac', 'bc'],
        ['ad', 'bd'],
      ],
      fills: [
        [PASTEL.lilas, PASTEL.peche],
        [PASTEL.menthe, PASTEL.citron],
      ],
      left: 54,
      top: 30,
      wholeWidth: 'a + b',
      wholeHeight: 'c + d',
    }),
  ),
)

/**
 * Factoriser, c'est lire le modèle des aires dans l'autre sens : deux
 * rectangles ka et kb de même hauteur k se recollent le long de ce côté commun
 * en un seul rectangle k × (a + b).
 */
function factorisationAires() {
  const a = 112
  const b = 70
  const k = 52
  const left = 74
  const piece = (x: number, size: number, name: string, label: string, fill: string) =>
    areaGrid({
      columns: [{ size, name }],
      rows: [{ size: k, name: 'k' }],
      areas: [[label]],
      fills: [[fill]],
      left: x,
      top: 30,
      rowColor: ACCENT,
    })
  return drawing(
    232,
    ...piece(50, a, 'a', 'ka', PASTEL.lilas),
    ...piece(214, b, 'b', 'kb', PASTEL.peche),
    text([182, 56], '+', { size: 17, weight: 700, color: GREY }),
    arrow([160, 92], [160, 122], { color: GREY, width: 1.75 }),
    text([172, 107], 'on recolle le long de k', { size: 13, color: GREY, anchor: 'start' }),
    ...areaGrid({
      columns: [
        { size: a, name: '' },
        { size: b, name: '' },
      ],
      rows: [{ size: k, name: 'k' }],
      areas: [['ka', 'kb']],
      fills: [[PASTEL.lilas, PASTEL.peche]],
      left,
      top: 136,
      wholeWidth: 'a + b',
      rowColor: ACCENT,
      dashedCuts: true,
    }),
  )
}

const factorisationAiresFigure = defineFigure('factorisation-aires', factorisationAires())

export const calculLitteralFigures: readonly FigureDefinition[] = [
  carreSomme,
  differenceCarresFigure,
  carreDeDeuxX,
  distributiviteSimple,
  distributiviteDouble,
  factorisationAiresFigure,
]
