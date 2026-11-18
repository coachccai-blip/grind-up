import { stripFigure, tableFigure, UNKNOWN } from './families.js'
import {
  ACCENT,
  add,
  arrow,
  circle,
  curvedArrow,
  curvedArrowTop,
  dashed,
  defineFigure,
  dot,
  drawing,
  type Drawing,
  type FigureDefinition,
  GREY,
  INK,
  labelAway,
  MIN_HEIGHT,
  line,
  type Part,
  PASTEL,
  path,
  plane,
  type Point,
  polygon,
  rect,
  segment,
  shifted,
  text,
  textWidth,
  WHITE,
  WIDTH,
  withUnit,
} from './svg.js'

/**
 * Illustrations du thème « Fonctions ». Une figure par entrée, construite avec les
 * familles de families.ts ou les primitives de svg.ts : voir docs/bibliotheque.md,
 * « Illustrer un exercice ».
 */

const NB = '\u00A0'

/** Un dessin trop bas (un tableau de deux lignes) se centre dans la hauteur minimale. */
const tall = (base: Drawing): Drawing =>
  base.height >= MIN_HEIGHT
    ? base
    : drawing(MIN_HEIGHT, shifted(base, 0, (MIN_HEIGHT - base.height) / 2))

// ---------------------------------------------------------------------------
// La machine : un nombre entre, la fonction le transforme, son image sort.

interface MachineOptions {
  input: string
  output: string
  /** Le nom de la fonction, écrit sur la machine. */
  name: string
  /** La formule, écrite sous le nom (« x ↦ 3x − 5 »). */
  rule?: string
  /** Écrire « antécédent » et « image » sous les deux nombres. */
  vocabulary?: boolean
  /** Une ligne sous le dessin (« f(4) = 11 »). */
  caption?: string
}

function machine({ input, output, name, rule, vocabulary, caption }: MachineOptions): Drawing {
  const y = 34
  const boxHeight = 44
  const middleY = y + boxHeight / 2
  const box = (x: number, value: string): Part[] => {
    const unknown = value === UNKNOWN
    return [
      rect([x, y], 52, boxHeight, {
        fill: unknown ? WHITE : PASTEL.citron,
        color: unknown ? ACCENT : INK,
        radius: 10,
      }),
      text([x + 26, middleY], value, {
        size: 17,
        weight: 700,
        color: unknown ? ACCENT : INK,
        halo: false,
      }),
    ]
  }
  const machineLeft = 106
  const machineWidth = 108
  const parts: Part[] = [
    ...box(14, input),
    arrow([70, middleY], [machineLeft - 6, middleY], { color: GREY, width: 2, head: 9 }),
    // La machine : un caisson avec une trémie en haut et une sortie à droite.
    polygon(
      [
        [machineLeft + 30, y - 16],
        [machineLeft + 78, y - 16],
        [machineLeft + 66, y - 2],
        [machineLeft + 42, y - 2],
      ],
      { fill: PASTEL.lilas, width: 1.75 },
    ),
    rect([machineLeft, y - 2], machineWidth, boxHeight + 4, {
      fill: PASTEL.lilas,
      radius: 12,
    }),
    text([machineLeft + machineWidth / 2, rule ? middleY - 9 : middleY], name, {
      size: 20,
      weight: 700,
      halo: false,
    }),
    rule &&
      text([machineLeft + machineWidth / 2, middleY + 12], rule, {
        size: 14,
        weight: 700,
        color: GREY,
        halo: false,
      }),
    arrow([machineLeft + machineWidth + 6, middleY], [WIDTH - 72, middleY], {
      color: GREY,
      width: 2,
      head: 9,
    }),
    ...box(WIDTH - 66, output),
  ]
  let height = y + boxHeight + 18
  if (vocabulary) {
    const labelY = y + boxHeight + 18
    parts.push(
      text([40, labelY], 'antécédent', { size: 14, weight: 700, color: GREY }),
      text([WIDTH - 40, labelY], 'image', { size: 14, weight: 700, color: ACCENT }),
    )
    height = labelY + 16
  }
  if (caption) {
    const captionY = height + 14
    parts.push(text([WIDTH / 2, captionY], caption, { size: 17, weight: 700 }))
    height = captionY + 20
  }
  return drawing(Math.max(height, 120), ...parts)
}

const machineRappel = defineFigure(
  'fonction-machine-rappel',
  machine({
    input: '4',
    output: '11',
    name: 'f',
    rule: 'x ↦ 2x + 3',
    vocabulary: true,
    caption: 'f(4) = 11',
  }),
)

const machineImage = defineFigure(
  'fonction-exemple-image',
  machine({ input: '6', output: UNKNOWN, name: 'f', rule: 'x ↦ 3x − 5', vocabulary: true }),
)

const machineAntecedent = defineFigure(
  'fonction-exemple-antecedent',
  machine({ input: UNKNOWN, output: '10', name: 'f', rule: 'x ↦ 3x − 5', vocabulary: true }),
)

const machineQ1 = defineFigure(
  'fonction-q1-machine',
  machine({ input: '3', output: '8', name: 'f', caption: 'f(3) = 8' }),
)

/** Le tableau de valeurs de h, donné par l'énoncé des questions 3 et 4. */
const tableauH = defineFigure(
  'fonction-tableau-h',
  tall(
    tableFigure({
      rows: [
        { label: 'x', values: ['−2', '−1', '0', '2', '3', '4'] },
        { label: 'h(x)', values: ['4', '1', '3', '4', '−1', '7'] },
      ],
    }),
  ),
)

// ---------------------------------------------------------------------------
// Fonctions linéaires

/** f(x) = 1,5x : une droite qui passe par l'origine et par le point (1 ; a). */
function lineaireRappel(): Drawing {
  const grid = plane({ x: [-1, 4], y: [-1, 4], unit: 38, left: 70 })
  const f = (x: number) => 1.5 * x
  const piece = grid.visible(f)!
  const origin = grid.at(0, 0)
  const point = grid.at(1, 1.5)
  // Les graduations 1 et 2 de l'axe des ordonnées encadrent a : on garde la place.
  const keepA: [Point, Point] = [add(grid.at(0, 1.5), [-14, -6]), add(grid.at(0, 1.5), [-14, 6])]
  return drawing(
    grid.height,
    grid.draw([piece, keepA]),
    grid.plot(f),
    dashed(point, grid.at(1, 0), { width: 1.5 }),
    dashed(point, grid.at(0, 1.5), { width: 1.5 }),
    dot(origin, { color: ACCENT }),
    dot(point, { color: ACCENT }),
    text(add(origin, [12, 12]), 'O', { weight: 700 }),
    text(add(grid.at(0, 1.5), [-12, 0]), 'a', { weight: 700, color: ACCENT, anchor: 'end' }),
    text(add(point, [10, 8]), `(1${NB}; a)`, { weight: 700, anchor: 'start' }),
    text(add(piece[1], [10, 10]), 'f', { weight: 700, color: ACCENT, anchor: 'start' }),
    text([300, 40], 'passe par', { size: 14, color: GREY, anchor: 'end' }),
    text([300, 58], 'l’origine', { size: 14, color: GREY, anchor: 'end' }),
  )
}

const lineaireDroite = defineFigure('fonction-lineaire-droite', lineaireRappel())

/**
 * Tableau de deux lignes et sa flèche « × k » à droite, bombée vers l'extérieur
 * (celle de la famille rentre dans le tableau quand il n'a que deux lignes).
 */
function tableTimes(rows: { label: string; values: string[] }[], factor: string): Drawing {
  const columns = Math.max(...rows.map((row) => row.values.length))
  const labelWidth = Math.max(...rows.map((row) => textWidth(row.label, 15, 700))) + 18
  const cellWidth = 52
  const cellHeight = 36
  const tableWidth = labelWidth + cellWidth * columns
  const room = textWidth(factor, 15, 700) + 40
  const left = (WIDTH - tableWidth - room) / 2
  const top = 12
  const parts: Part[] = []
  rows.forEach((row, index) => {
    const y = top + cellHeight * index
    parts.push(
      rect([left, y], labelWidth, cellHeight, { fill: PASTEL.ciel, width: 1.5 }),
      text([left + labelWidth / 2, y + cellHeight / 2], row.label, { weight: 700, halo: false }),
    )
    row.values.forEach((value, column) => {
      const x = left + labelWidth + cellWidth * column
      parts.push(
        rect([x, y], cellWidth, cellHeight, { fill: WHITE, width: 1.5 }),
        text([x + cellWidth / 2, y + cellHeight / 2], value, {
          weight: value === UNKNOWN ? 700 : 600,
          color: value === UNKNOWN ? ACCENT : INK,
          halo: false,
        }),
      )
    })
  })
  const right = left + tableWidth
  const a: Point = [right + 6, top + cellHeight / 2]
  const b: Point = [right + 6, top + cellHeight * 1.5]
  return tall(
    drawing(
      top * 2 + cellHeight * rows.length,
      ...parts,
      curvedArrow(a, b, 14, { color: ACCENT, width: 1.75 }),
      text(add(curvedArrowTop(a, b, 14), [8, 0]), factor, {
        color: ACCENT,
        weight: 700,
        anchor: 'start',
      }),
    ),
  )
}

const lineaireTableau = defineFigure(
  'fonction-lineaire-prix-kilo',
  tableTimes(
    [
      { label: 'Masse (kg)', values: ['1', '2', '4'] },
      { label: 'Prix (€)', values: ['3', '6', '12'] },
    ],
    '× 3',
  ),
)

const lineaireExemple = defineFigure(
  'fonction-lineaire-exemple-tableau',
  tableTimes(
    [
      { label: 'x', values: ['6', '10', UNKNOWN] },
      { label: 'f(x)', values: ['9', UNKNOWN, '12'] },
    ],
    '× a',
  ),
)

const lineaireBaisse = defineFigure(
  'fonction-lineaire-exemple-baisse',
  stripFigure({
    groups: [
      { parts: 7, fill: PASTEL.menthe, label: 'nouveau prix' },
      { parts: 3, fill: PASTEL.rose, label: `−${withUnit(30, '%')}` },
    ],
    total: `ancien prix${NB}: ${withUnit(60, '€')}`,
  }),
)

/** Une balance de marché, un panier de cerises et l'étiquette du prix. */
function cerises(): Drawing {
  const parts: Part[] = []
  // La balance : un plateau, un pied, un cadran.
  parts.push(
    path('M 40 212 L 56 150 L 176 150 L 192 212 Z', { fill: PASTEL.ciel }),
    rect([76, 168], 80, 30, { fill: WHITE, radius: 6, width: 1.75 }),
    text([116, 183], withUnit(2.5, 'kg'), { weight: 700, halo: false }),
    rect([50, 136], 132, 12, { fill: PASTEL.lilas, radius: 6 }),
  )
  // Le panier de cerises.
  parts.push(
    path('M 66 98 L 166 98 L 156 134 L 76 134 Z', { fill: PASTEL.citron }),
    path('M 80 98 Q 116 50 152 98', { color: GREY, width: 2 }),
  )
  const cherries: Point[] = [
    [86, 92],
    [104, 88],
    [124, 90],
    [144, 92],
    [96, 78],
    [116, 76],
    [136, 80],
  ]
  for (const [x, y] of cherries) {
    parts.push(
      path(`M ${x} ${y - 8} Q ${x + 3} ${y - 18} ${x + 9} ${y - 22}`, { color: GREY, width: 1.5 }),
      circle([x, y], 8, { fill: PASTEL.rose, width: 1.75 }),
    )
  }
  // L'étiquette du prix, accrochée par une ficelle.
  parts.push(
    path('M 184 120 Q 204 100 222 96', { color: GREY, width: 1.5 }),
    polygon(
      [
        [222, 80],
        [292, 80],
        [292, 120],
        [222, 120],
        [210, 100],
      ],
      { fill: PASTEL.peche },
    ),
    circle([222, 100], 3.5, { fill: WHITE, width: 1.5 }),
    text([258, 100], withUnit(14, '€'), { size: 19, weight: 700, halo: false }),
  )
  return drawing(226, ...parts)
}

const lineaireCerises = defineFigure('fonction-lineaire-q5-cerises', cerises())

/** Une étiquette de soldes « −15 % » et les deux prix. */
function soldes(): Drawing {
  return drawing(
    140,
    polygon(
      [
        [40, 30],
        [150, 30],
        [150, 110],
        [40, 110],
        [18, 70],
      ],
      { fill: PASTEL.rose },
    ),
    circle([40, 70], 5, { fill: WHITE, width: 1.5 }),
    text([96, 58], 'SOLDES', { size: 15, weight: 700, color: GREY, halo: false }),
    text([96, 84], `−${withUnit(15, '%')}`, { size: 24, weight: 700, halo: false }),
    text([170, 54], `ancien prix${NB}: x`, { weight: 700, anchor: 'start' }),
    text([170, 88], `nouveau prix${NB}: `, { weight: 700, anchor: 'start' }),
    text([176 + textWidth(`nouveau prix${NB}: `, 15, 700), 88], UNKNOWN, {
      size: 17,
      weight: 700,
      color: ACCENT,
      anchor: 'start',
    }),
  )
}

const lineaireSoldes = defineFigure('fonction-lineaire-q6-soldes', soldes())

// ---------------------------------------------------------------------------
// Fonctions affines

/** f(x) = 2x + 1 : b se lit sur l'axe des ordonnées, a dans la marche « +1, +a ». */
function affineRappel(): Drawing {
  const grid = plane({ x: [-2, 3], y: [-1, 5], unit: 34, left: 30 })
  const f = (x: number) => 2 * x + 1
  const piece = grid.visible(f)!
  const b = grid.at(0, 1)
  const corner = grid.at(1, 1)
  const top = grid.at(1, 3)
  const keepB: [Point, Point] = [add(b, [-14, -1]), add(b, [-14, 1])]
  return drawing(
    grid.height,
    grid.draw([piece, keepB, [corner, top]]),
    grid.plot(f),
    segment(b, corner, { color: GREY, width: 2, dashed: true }),
    arrow(corner, top, { color: ACCENT, width: 2, head: 8 }),
    dot(b, { color: ACCENT }),
    text(add(b, [-10, 0]), 'b', { size: 17, weight: 700, color: ACCENT, anchor: 'end' }),
    text(add(grid.at(0.5, 1), [0, 13]), '+1', { weight: 700, color: GREY }),
    text(add(grid.at(1, 2), [10, 0]), '+a', { weight: 700, color: ACCENT, anchor: 'start' }),
    text(add(piece[1], [8, 10]), 'f', { weight: 700, color: ACCENT, anchor: 'start' }),
    text([300, 110], 'b', { weight: 700, color: ACCENT, anchor: 'end' }),
    text([300, 128], 'image de 0', { size: 14, color: GREY, anchor: 'end' }),
    text([300, 160], '+a', { weight: 700, color: ACCENT, anchor: 'end' }),
    text([300, 178], 'quand x', { size: 14, color: GREY, anchor: 'end' }),
    text([300, 194], 'augmente de 1', { size: 14, color: GREY, anchor: 'end' }),
  )
}

const affineDroite = defineFigure('fonction-affine-a-et-b', affineRappel())

/** Trois petits repères : a positif, a négatif, a nul. */
function signesDeA(): Drawing {
  const parts: Part[] = []
  const panels: { slope: number; label: string }[] = [
    { slope: 0.8, label: 'a > 0' },
    { slope: -0.8, label: 'a < 0' },
    { slope: 0, label: 'a = 0' },
  ]
  panels.forEach(({ slope, label }, index) => {
    const center: Point = [58 + index * 102, 66]
    parts.push(
      arrow(add(center, [-40, 0]), add(center, [42, 0]), { width: 1.5, head: 7 }),
      arrow(add(center, [0, 40]), add(center, [0, -44]), { width: 1.5, head: 7 }),
    )
    const start = add(center, [-34, 34 * slope - 14])
    const end = add(center, [34, -34 * slope - 14])
    parts.push(
      line(start, end, { color: ACCENT, width: 2.5, extend: 0 }),
      text([center[0], 130], label, { weight: 700 }),
    )
  })
  parts.push(
    text([58, 154], 'elle monte', { size: 14, color: GREY }),
    text([160, 154], 'elle descend', { size: 14, color: GREY }),
    text([262, 154], 'constante', { size: 14, color: GREY }),
  )
  return drawing(168, ...parts)
}

const affineSignes = defineFigure('fonction-affine-signe-de-a', signesDeA())

const affineExempleTableau = defineFigure(
  'fonction-affine-exemple-deux-images',
  tableFigure({
    rows: [
      { label: 'x', values: ['2', '5'] },
      { label: 'f(x)', values: ['7', '16'] },
    ],
    columnArrows: [
      { from: 0, to: 1, label: '+ 3', side: 'top' },
      { from: 0, to: 1, label: '+ 9', side: 'bottom' },
    ],
  }),
)

/** g(x) = 2x − 3 et le point A(4 ; 6). */
function affinePoint(): Drawing {
  const grid = plane({ x: [0, 5], y: [-3, 7], unit: 22, left: 110 })
  const g = (x: number) => 2 * x - 3
  const piece = grid.visible(g)!
  const a = grid.at(4, 6)
  // Le « 0 » de l'origine toucherait le « −1 » de l'axe des ordonnées : on l'omet.
  const origin = grid.at(0, 0)
  const keepOrigin: [Point, Point] = [add(origin, [-9, 10]), add(origin, [-9, 12])]
  return drawing(
    grid.height,
    grid.draw([piece, keepOrigin]),
    grid.plot(g),
    dashed(a, grid.at(4, 0), { width: 1.5 }),
    dashed(a, grid.at(0, 6), { width: 1.5 }),
    dot(a),
    labelAway(a, [-0.5, -1], 'A', 5, { weight: 700 }),
    text(add(piece[1], [8, 8]), 'g', { weight: 700, color: ACCENT, anchor: 'start' }),
  )
}

const affineExemplePoint = defineFigure('fonction-affine-exemple-point', affinePoint())

/** Le panneau des deux tarifs de la piscine. */
function piscine(): Drawing {
  const card = (
    left: number,
    title: string,
    base: string,
    price: string,
    perEntry: string,
  ): Part[] => [
    rect([left, 20], 138, 112, { fill: WHITE, radius: 12 }),
    rect([left, 20], 138, 34, { fill: PASTEL.ciel, radius: 12 }),
    rect([left, 40], 138, 14, { fill: PASTEL.ciel, width: 0 }),
    segment([left, 54], [left + 138, 54], { width: 1.5 }),
    text([left + 69, 37], title, { size: 17, weight: 700, halo: false }),
    text([left + 69, 70], base, { size: 14, color: GREY, halo: false }),
    text([left + 69, 92], price, { size: 17, weight: 700, halo: false }),
    text([left + 69, 118], perEntry, { size: 14, weight: 700, color: ACCENT, halo: false }),
  ]
  const wave = 'M 14 152 Q 34 140 54 152 T 94 152 T 134 152 T 174 152 T 214 152 T 254 152 T 294 152'
  return drawing(
    170,
    ...card(14, 'Tarif A', 'carte', withUnit(15, '€'), `+ ${withUnit(9, '€')} par entrée`),
    ...card(168, 'Tarif B', 'abonnement', withUnit(75, '€'), `+ ${withUnit(3, '€')} par entrée`),
    path(wave, { color: ACCENT, width: 2 }),
  )
}

const affinePiscine = defineFigure('fonction-affine-q6-piscine', piscine())

export const fonctionsFigures: readonly FigureDefinition[] = [
  machineRappel,
  machineImage,
  machineAntecedent,
  machineQ1,
  tableauH,
  lineaireDroite,
  lineaireTableau,
  lineaireExemple,
  lineaireBaisse,
  lineaireCerises,
  lineaireSoldes,
  affineDroite,
  affineSignes,
  affineExempleTableau,
  affineExemplePoint,
  affinePiscine,
]
