import {
  ACCENT,
  add,
  arrow,
  brace,
  circle,
  dashed,
  defineFigure,
  drawing,
  type Drawing,
  type FigureDefinition,
  GREY,
  INK,
  type Part,
  PASTEL,
  path,
  polar,
  polygon,
  type Point,
  rect,
  sector,
  segment,
  text,
  WHITE,
  WIDTH,
} from './svg.js'

/**
 * Illustrations du thème « Statistiques et probabilités ». Une figure par entrée, construite avec les
 * familles de families.ts ou les primitives de svg.ts : voir docs/bibliotheque.md,
 * « Illustrer un exercice ».
 */

/** Espace insécable, devant « ; » et « : ». */
const NBSP = '\u00A0'

// ---------------------------------------------------------------------------
// Statistiques : une série rangée sur une droite graduée

interface RankedSeriesOptions {
  values: readonly number[]
  min: number
  max: number
  /** Graduer de `every` en `every` sous l'axe. */
  every: number
  /** La médiane, placée par une ligne pointillée, et son étiquette. */
  median: { at: number; label: string }
  /** L'étiquette des deux accolades (« 3 valeurs »). */
  half: string
  /** L'étiquette de la cote de l'étendue. */
  range: string
}

function rankedSeries(options: RankedSeriesOptions): Drawing {
  const { values, min, max, every, median, half, range } = options
  const sorted = [...values].sort((a, b) => a - b)
  const x = (value: number) => 24 + ((value - min) * 272) / (max - min)
  const axisY = 132
  const parts: Part[] = [arrow([x(min) - 6, axisY], [x(max) + 14, axisY], { width: 1.5, head: 8 })]
  for (let value = min; value <= max; value++) {
    const major = (value - min) % every === 0
    parts.push(
      segment([x(value), axisY - (major ? 5 : 3)], [x(value), axisY + (major ? 5 : 3)], {
        width: major ? 1.5 : 1,
        color: major ? INK : GREY,
      }),
    )
    if (major) parts.push(text([x(value), axisY + 17], String(value), { size: 13, color: GREY }))
  }
  // La médiane : une ligne pointillée qui partage la série.
  parts.push(
    dashed([x(median.at), 32], [x(median.at), axisY + 8], { color: ACCENT, width: 2 }),
    text([x(median.at), 18], median.label, { weight: 700, color: ACCENT }),
  )
  // Les valeurs : un disque par valeur, empilés quand une valeur revient.
  const seen = new Map<number, number>()
  let highest = axisY
  for (const value of sorted) {
    const rank = seen.get(value) ?? 0
    seen.set(value, rank + 1)
    const y = axisY - 12 - rank * 15
    highest = Math.min(highest, y)
    parts.push(
      circle([x(value), y], 6.5, {
        fill: value === median.at ? ACCENT : PASTEL.lilas,
        width: 1.75,
      }),
    )
  }
  for (const [value, count] of seen) {
    parts.push(text([x(value), axisY - 12 - count * 15 - 4], String(value), { weight: 700 }))
  }
  // Deux accolades : autant de valeurs de chaque côté de la médiane.
  const lower = sorted.filter((value) => value < median.at)
  const upper = sorted.filter((value) => value > median.at)
  const braceY = Math.min(highest - 32, 84)
  const below: Point = [160, 240]
  parts.push(
    brace([x(lower[0]!) - 6, braceY], [x(lower.at(-1)!) + 6, braceY], half, { outside: below }),
    brace([x(upper[0]!) - 6, braceY], [x(upper.at(-1)!) + 6, braceY], half, { outside: below }),
  )
  // L'étendue : de la plus petite valeur à la plus grande.
  parts.push(
    arrow([x(sorted[0]!), axisY + 36], [x(sorted.at(-1)!), axisY + 36], {
      both: true,
      color: GREY,
      width: 1.5,
      head: 7,
    }),
    segment([x(sorted[0]!), axisY + 30], [x(sorted[0]!), axisY + 42], { color: GREY, width: 1.5 }),
    segment([x(sorted.at(-1)!), axisY + 30], [x(sorted.at(-1)!), axisY + 42], {
      color: GREY,
      width: 1.5,
    }),
    text([(x(sorted[0]!) + x(sorted.at(-1)!)) / 2, axisY + 54], range, { weight: 700 }),
  )
  return drawing(axisY + 70, ...parts)
}

const serieRangee = defineFigure(
  'stat-serie-rangee',
  rankedSeries({
    values: [2, 5, 6, 8, 11, 12, 15],
    min: 0,
    max: 16,
    every: 5,
    median: { at: 8, label: 'médiane' },
    half: '3 valeurs',
    range: `étendue${NBSP}: 15 − 2`,
  }),
)

const seriePompes = defineFigure(
  'stat-exemple-pompes',
  rankedSeries({
    values: [16, 8, 21, 12, 8, 19],
    min: 6,
    max: 22,
    every: 2,
    median: { at: 14, label: 'médiane' },
    half: '3 valeurs',
    range: 'étendue',
  }),
)

/** Les notes de Yanis : une note de coefficient 3 compte trois fois. */
function coefficients(): Drawing {
  const groups = [
    { note: '10', count: 1, fill: PASTEL.lilas },
    { note: '13', count: 2, fill: PASTEL.menthe },
    { note: '16', count: 3, fill: PASTEL.peche },
  ]
  const card = 36
  const gap = 6
  const groupGap = 28
  const total =
    groups.reduce((sum, group) => sum + group.count * card + (group.count - 1) * gap, 0) +
    groupGap * (groups.length - 1)
  let left = (WIDTH - total) / 2
  const parts: Part[] = []
  for (const { note, count, fill } of groups) {
    const width = count * card + (count - 1) * gap
    for (let index = 0; index < count; index++) {
      const at: Point = [left + index * (card + gap), 26]
      parts.push(
        rect(at, card, 48, { fill, radius: 7 }),
        text([at[0] + card / 2, at[1] + 24], note, { weight: 700, halo: false }),
      )
    }
    parts.push(
      text([left + width / 2, 94], `coef. ${count}`, { size: 14, weight: 700, color: GREY }),
    )
    left += width + groupGap
  }
  parts.push(text([WIDTH / 2, 124], 'comme 6 notes', { size: 14, color: GREY }))
  return drawing(140, ...parts)
}

const notesYanis = defineFigure('stat-exemple-coefficients', coefficients())

/** Six élèves, de la taille donnée par l'énoncé, dans l'ordre de l'énoncé. */
function tailles(): Drawing {
  const sizes = [158, 172, 149, 165, 180, 161]
  const fills = [PASTEL.lilas, PASTEL.menthe, PASTEL.peche, PASTEL.ciel, PASTEL.citron, PASTEL.rose]
  const ground = 238
  const parts: Part[] = [
    text([12, 20], 'tailles en cm', { size: 14, color: GREY, anchor: 'start' }),
    segment([14, ground], [306, ground], { color: GREY, width: 2 }),
  ]
  sizes.forEach((size, index) => {
    const center = 35 + index * 50
    const top = ground - (size - 120) * 3
    parts.push(
      rect([center - 15, top + 24], 30, ground - top - 24, { fill: fills[index], radius: 9 }),
      circle([center, top + 11], 11, { fill: fills[index] }),
      text([center, top - 10], String(size), { weight: 700 }),
    )
  })
  return drawing(250, ...parts)
}

const taillesEleves = defineFigure('stat-q2-tailles', tailles())

/** Diagramme en bâtons des buts marqués par match, sans moyenne ni médiane. */
function buts(): Drawing {
  const counts = [4, 7, 6, 3]
  const originX = 54
  const originY = 196
  const unit = 20
  const parts: Part[] = [
    text([originX - 6, 18], 'nombre de matchs', { size: 14, color: GREY, anchor: 'start' }),
  ]
  for (let value = 1; value <= 7; value++) {
    parts.push(
      segment([originX, originY - value * unit], [300, originY - value * unit], {
        color: PASTEL.ciel,
        width: 1,
      }),
      text([originX - 8, originY - value * unit], String(value), {
        size: 13,
        color: GREY,
        anchor: 'end',
      }),
    )
  }
  counts.forEach((count, goals) => {
    const center = originX + 46 + goals * 58
    parts.push(
      rect([center - 18, originY - count * unit], 36, count * unit, {
        fill: PASTEL.lilas,
        width: 1.75,
      }),
      text([center, originY + 14], String(goals), { weight: 700 }),
    )
  })
  parts.push(
    arrow([originX, originY], [306, originY], { width: 1.5, head: 8 }),
    arrow([originX, originY], [originX, 32], { width: 1.5, head: 8 }),
    text([180, originY + 36], 'nombre de buts dans le match', { size: 14, color: GREY }),
  )
  return drawing(originY + 50, ...parts)
}

const butsParMatch = defineFigure('stat-q5-buts', buts())

// ---------------------------------------------------------------------------
// Probabilités : dés, urnes, roue, cartes

/** Une face de dé avec ses points. */
function dieFace(center: Point, size: number, value: number, fill: string = WHITE, bold = false) {
  const o = size * 0.27
  const spots: Record<number, Point[]> = {
    1: [[0, 0]],
    2: [
      [-o, -o],
      [o, o],
    ],
    3: [
      [-o, -o],
      [0, 0],
      [o, o],
    ],
    4: [
      [-o, -o],
      [o, -o],
      [-o, o],
      [o, o],
    ],
    5: [
      [-o, -o],
      [o, -o],
      [0, 0],
      [-o, o],
      [o, o],
    ],
    6: [
      [-o, -o],
      [o, -o],
      [-o, 0],
      [o, 0],
      [-o, o],
      [o, o],
    ],
  }
  return [
    rect([center[0] - size / 2, center[1] - size / 2], size, size, {
      fill,
      radius: size * 0.18,
      color: bold ? ACCENT : INK,
      width: bold ? 2.5 : 2,
    }),
    ...(spots[value] ?? []).map((spot) =>
      circle(add(center, spot), size * 0.085, { fill: INK, color: INK, width: 1 }),
    ),
  ].join('')
}

/** Les six faces d'un dé, en ligne ; `marked` donne les faces mises en valeur. */
function dieRow(
  marked: readonly number[],
  captions: readonly { text: string; accent?: boolean }[],
) {
  const size = 40
  const gap = 10
  const left = (WIDTH - 6 * size - 5 * gap) / 2
  const parts: Part[] = []
  for (let value = 1; value <= 6; value++) {
    const center: Point = [left + size / 2 + (value - 1) * (size + gap), 40]
    const on = marked.includes(value)
    parts.push(dieFace(center, size, value, on ? PASTEL.citron : WHITE, on))
  }
  captions.forEach(({ text: content, accent }, index) => {
    parts.push(
      text([WIDTH / 2, 88 + index * 22], content, {
        size: accent ? 15 : 14,
        weight: 700,
        color: accent ? ACCENT : GREY,
      }),
    )
  })
  return drawing(120, ...parts)
}

const deMultipleDe3 = defineFigure(
  'proba-de-multiple-de-3',
  dieRow(
    [3, 6],
    [
      { text: 'événement «\u00A0obtenir un multiple de 3\u00A0»' },
      { text: `issues favorables${NBSP}: 3 et 6`, accent: true },
    ],
  ),
)

const deSauf6 = defineFigure(
  'proba-exemple-de-sauf-6',
  dieRow([1, 2, 3, 4, 5], [{ text: '«\u00A0ne pas obtenir 6\u00A0»', accent: true }]),
)

const deSixFaces = defineFigure('proba-de-six-faces', dieRow([], []))

/** L'échelle des probabilités, de l'impossible au certain. */
function echelle(): Drawing {
  const left = 30
  const right = 290
  const y = 56
  const ticks: { at: number; label: string; under: string; anchor: 'start' | 'middle' | 'end' }[] =
    [
      { at: left, label: '0', under: 'impossible', anchor: 'start' },
      { at: (left + right) / 2, label: '1/2', under: '1 chance sur 2', anchor: 'middle' },
      { at: right, label: '1', under: 'certain', anchor: 'end' },
    ]
  return drawing(
    120,
    rect([left, y - 8], (right - left) / 2, 16, { fill: PASTEL.rose, width: 0 }),
    rect([(left + right) / 2, y - 8], (right - left) / 2, 16, { fill: PASTEL.menthe, width: 0 }),
    rect([left, y - 8], right - left, 16, { width: 1.75 }),
    ...ticks.flatMap(({ at, label, under, anchor }) => [
      segment([at, y - 14], [at, y + 14], { width: 2 }),
      text([anchor === 'start' ? at - 4 : anchor === 'end' ? at + 4 : at, y - 28], label, {
        size: 17,
        weight: 700,
        anchor,
      }),
      text([anchor === 'start' ? at - 4 : anchor === 'end' ? at + 4 : at, y + 30], under, {
        size: 14,
        weight: 700,
        color: GREY,
        anchor,
      }),
    ]),
  )
}

const echelleProbabilites = defineFigure('proba-echelle', echelle())

interface Ball {
  label: string
  fill: string
  dark?: boolean
}

/** n boules identiques, pour remplir une urne ou un sac. */
const balls = (count: number, label: string, fill: string, dark = false): Ball[] =>
  Array.from({ length: count }, () => ({ label, fill, dark }))

interface ContainerOptions {
  kind: 'urne' | 'sac'
  content: readonly Ball[]
  /** Les couleurs, écrites à droite : une boule témoin et son nom. */
  legend: readonly { label: string; fill: string; name: string; dark?: boolean }[]
  radius: number
  perRow: number
}

/** Une urne (ou un sac) et les boules (ou jetons) qu'elle contient, d'après l'énoncé. */
function container({ kind, content, legend, radius, perRow }: ContainerOptions): Drawing {
  const parts: Part[] = []
  if (kind === 'urne') {
    parts.push(
      path(
        'M 64 34 L 64 50 Q 26 66 26 116 L 26 206 Q 26 230 52 230 L 168 230 Q 194 230 194 206 L 194 116 Q 194 66 156 50 L 156 34',
        { fill: WHITE },
      ),
      segment([54, 34], [166, 34], { width: 3 }),
    )
  } else {
    parts.push(
      path('M 72 52 Q 30 74 26 146 Q 24 228 110 230 Q 196 228 194 146 Q 190 74 148 52 Z', {
        fill: PASTEL.peche,
      }),
      path('M 72 52 L 58 28 L 162 28 L 148 52', { fill: PASTEL.peche }),
      path('M 70 52 Q 110 60 150 52', { color: GREY, width: 3 }),
    )
  }
  const spacing = radius * 2 + 4
  const rows = Math.ceil(content.length / perRow)
  content.forEach(({ label, fill, dark }, index) => {
    const row = Math.floor(index / perRow)
    const inRow = row === rows - 1 ? content.length - row * perRow : perRow
    const column = index % perRow
    const center: Point = [
      110 + (column - (inRow - 1) / 2) * spacing,
      (kind === 'sac' ? 206 : 216) - radius - (rows - 1 - row) * spacing,
    ]
    parts.push(
      circle(center, radius, { fill, width: 1.75 }),
      text(center, label, {
        size: radius >= 14 ? 14 : 13,
        weight: 700,
        color: dark ? WHITE : INK,
        halo: false,
      }),
    )
  })
  legend.forEach(({ label, fill, name, dark }, index) => {
    const y = 80 + index * 40
    parts.push(
      circle([226, y], 12, { fill, width: 1.75 }),
      text([226, y], label, { size: 13, weight: 700, color: dark ? WHITE : INK, halo: false }),
      text([246, y], name, { weight: 700, anchor: 'start' }),
    )
  })
  return drawing(244, ...parts)
}

const ROUGE = { label: 'R', fill: PASTEL.rose }
const BLEU = { label: 'B', fill: PASTEL.ciel }
const VERT = { label: 'V', fill: PASTEL.menthe }
const JAUNE = { label: 'J', fill: PASTEL.citron }

const sacJetons = defineFigure(
  'proba-exemple-sac',
  container({
    kind: 'sac',
    content: [
      ...balls(3, 'R', ROUGE.fill),
      ...balls(4, 'V', VERT.fill),
      ...balls(5, 'B', BLEU.fill),
    ],
    legend: [
      { ...ROUGE, name: 'rouge' },
      { ...VERT, name: 'vert' },
      { ...BLEU, name: 'bleu' },
    ],
    radius: 14,
    perRow: 4,
  }),
)

const urneQ2 = defineFigure(
  'proba-q2-urne',
  container({
    kind: 'urne',
    content: [
      ...balls(4, 'R', ROUGE.fill),
      ...balls(6, 'B', BLEU.fill),
      ...balls(10, 'J', JAUNE.fill),
    ],
    legend: [
      { ...ROUGE, name: 'rouge' },
      { ...BLEU, name: 'bleue' },
      { ...JAUNE, name: 'jaune' },
    ],
    radius: 11,
    perRow: 6,
  }),
)

/** Une roue de loterie partagée en secteurs égaux, et sa flèche. */
function roue(numbers: readonly string[]): Drawing {
  const center: Point = [WIDTH / 2, 124]
  const radius = 92
  const fills = [PASTEL.lilas, PASTEL.menthe, PASTEL.peche, PASTEL.citron, PASTEL.ciel]
  const step = 360 / numbers.length
  const parts: Part[] = []
  numbers.forEach((number, index) => {
    const to = 90 - index * step + step / 2
    const from = to - step
    parts.push(
      sector(center, radius, from, to, { fill: fills[index % fills.length], width: 1.75 }),
      text(polar(center, radius * 0.62, (from + to) / 2), number, {
        size: 19,
        weight: 700,
        halo: false,
      }),
    )
  })
  parts.push(
    circle(center, radius),
    circle(center, 6, { fill: INK }),
    polygon(
      [
        [center[0] - 10, center[1] - radius - 22],
        [center[0] + 10, center[1] - radius - 22],
        [center[0], center[1] - radius + 6],
      ],
      { fill: ACCENT, color: ACCENT },
    ),
  )
  return drawing(center[1] + radius + 14, ...parts)
}

const roueQ4 = defineFigure('proba-q4-roue', roue(['2', '4', '6', '8', '10']))

/** Les huit cartes d'une couleur, puis les quatre couleurs. */
function cartes(): Drawing {
  const values = ['7', '8', '9', '10', 'V', 'D', 'R', 'As']
  const width = 32
  const gap = 5
  const left = (WIDTH - values.length * width - (values.length - 1) * gap) / 2
  const parts: Part[] = [
    text([WIDTH / 2, 18], `une couleur${NBSP}: 8 cartes`, { size: 14, weight: 700, color: GREY }),
  ]
  values.forEach((value, index) => {
    const x = left + index * (width + gap)
    parts.push(
      rect([x, 34], width, 50, { fill: WHITE, radius: 5 }),
      text([x + width / 2, 59], value, { weight: 700, halo: false }),
    )
  })
  const suits = ['♠ pique', '♥ cœur', '♦ carreau', '♣ trèfle']
  parts.push(text([WIDTH / 2, 106], '4 couleurs', { size: 14, weight: 700, color: GREY }))
  suits.forEach((suit, index) => {
    parts.push(text([44 + index * 77, 130], suit, { weight: 700 }))
  })
  return drawing(146, ...parts)
}

const cartesQ5 = defineFigure('proba-q5-cartes', cartes())

/** Vingt jetons numérotés de 1 à 20. */
function jetons(): Drawing {
  const parts: Part[] = []
  for (let number = 1; number <= 20; number++) {
    const row = Math.floor((number - 1) / 5)
    const column = (number - 1) % 5
    const center: Point = [80 + column * 40, 26 + row * 38]
    parts.push(
      circle(center, 16, { fill: PASTEL.citron, width: 1.75 }),
      text(center, String(number), { size: 14, weight: 700, halo: false }),
    )
  }
  return drawing(166, ...parts)
}

const jetonsQ6 = defineFigure('proba-q6-jetons', jetons())

// ---------------------------------------------------------------------------
// Deux épreuves : arbre et tableau à double entrée

/** Arbre : une pièce, puis une roue à trois secteurs. Chaque chemin est une issue. */
function arbrePieceRoue(): Drawing {
  const first = ['P', 'F']
  const second = ['1', '2', '3']
  const rootAt: Point = [18, 0]
  const x1 = 92
  const x2 = 172
  const xIssue = 260
  const top = 52
  const spacing = 30
  const parts: Part[] = [
    text([x1, 20], 'pièce', { size: 14, weight: 700, color: GREY }),
    text([x2, 20], 'roue', { size: 14, weight: 700, color: GREY }),
    text([xIssue, 20], 'issue', { size: 14, weight: 700, color: GREY }),
  ]
  const leafCount = first.length * second.length
  const root: Point = [rootAt[0], top + ((leafCount - 1) * spacing) / 2]
  parts.push(circle(root, 3.5, { fill: INK }))
  first.forEach((face, i) => {
    const node: Point = [x1, top + (i * second.length + (second.length - 1) / 2) * spacing]
    parts.push(segment(root, add(node, [-14, 0]), { color: GREY, width: 1.75 }))
    second.forEach((number, j) => {
      const leaf: Point = [x2, top + (i * second.length + j) * spacing]
      parts.push(
        segment(add(node, [12, 0]), add(leaf, [-12, 0]), { color: GREY, width: 1.75 }),
        text(leaf, number, { weight: 700 }),
        text([xIssue, leaf[1]], `(${face}${NBSP}; ${number})`, { weight: 700, color: ACCENT }),
      )
    })
    parts.push(text(node, face, { size: 17, weight: 700 }))
  })
  return drawing(top + (leafCount - 1) * spacing + 22, ...parts)
}

const arbreRappel = defineFigure('epreuves-arbre-rappel', arbrePieceRoue())

interface DoubleTableOptions {
  caption: string
  rows: readonly string[]
  columns: readonly string[]
  cell: (row: string, column: string) => { text: string; highlight?: boolean }
  cellWidth: number
}

/** Tableau à double entrée : une ligne par résultat de la première épreuve, une colonne par résultat de la seconde. */
function doubleTable({ caption, rows, columns, cell, cellWidth }: DoubleTableOptions): Drawing {
  const head = 44
  const height = 34
  const width = head + cellWidth * columns.length
  const left = (WIDTH - width) / 2
  const top = 34
  const parts: Part[] = [
    text([WIDTH / 2, 15], caption, { size: 14, weight: 700, color: GREY }),
    rect([left, top], head, height, { fill: PASTEL.lilas, width: 1.5 }),
  ]
  columns.forEach((column, j) => {
    const x = left + head + j * cellWidth
    parts.push(
      rect([x, top], cellWidth, height, { fill: PASTEL.ciel, width: 1.5 }),
      text([x + cellWidth / 2, top + height / 2], column, { weight: 700, halo: false }),
    )
  })
  rows.forEach((row, i) => {
    const y = top + (i + 1) * height
    parts.push(
      rect([left, y], head, height, { fill: PASTEL.ciel, width: 1.5 }),
      text([left + head / 2, y + height / 2], row, { weight: 700, halo: false }),
    )
    columns.forEach((column, j) => {
      const x = left + head + j * cellWidth
      const { text: content, highlight } = cell(row, column)
      parts.push(
        rect([x, y], cellWidth, height, {
          fill: highlight ? PASTEL.citron : WHITE,
          width: 1.5,
        }),
        text([x + cellWidth / 2, y + height / 2], content, {
          weight: 700,
          color: highlight ? ACCENT : INK,
          halo: false,
        }),
      )
    })
  })
  return drawing(Math.max(120, top + (rows.length + 1) * height + 12), ...parts)
}

const tableauRappel = defineFigure(
  'epreuves-tableau-rappel',
  doubleTable({
    caption: `lignes${NBSP}: la pièce · colonnes${NBSP}: la roue`,
    rows: ['P', 'F'],
    columns: ['1', '2', '3'],
    cell: (row, column) => ({ text: `(${row}${NBSP}; ${column})` }),
    cellWidth: 70,
  }),
)

const tableauSommes = defineFigure(
  'epreuves-exemple-roue-somme',
  doubleTable({
    caption: `lignes${NBSP}: 1er tour · colonnes${NBSP}: 2e tour`,
    rows: ['1', '2', '3'],
    columns: ['1', '2', '3'],
    cell: (row, column) => {
      const sum = Number(row) + Number(column)
      return { text: String(sum), highlight: sum === 4 }
    },
    cellWidth: 60,
  }),
)

const NOIR = { label: 'N', fill: GREY, dark: true }

const sacSansRemise = defineFigure(
  'epreuves-exemple-sac',
  container({
    kind: 'sac',
    content: [
      { label: 'R1', fill: ROUGE.fill },
      { label: 'R2', fill: ROUGE.fill },
      { label: 'R3', fill: ROUGE.fill },
      { ...NOIR },
    ],
    legend: [
      { ...ROUGE, name: 'rouge' },
      { ...NOIR, name: 'noir' },
    ],
    radius: 18,
    perRow: 2,
  }),
)

/** Deux dés, un rouge et un bleu, dont on additionne les nombres. */
function deuxDes(): Drawing {
  const size = 64
  const die = (center: Point, fill: string, name: string): Part[] => [
    rect([center[0] - size / 2, center[1] - size / 2], size, size, { fill, radius: 12 }),
    text(center, '?', { size: 24, weight: 700, color: ACCENT, halo: false }),
    text([center[0], center[1] + size / 2 + 20], name, { weight: 700 }),
  ]
  return drawing(
    140,
    ...die([86, 56], PASTEL.rose, 'dé rouge'),
    text([160, 56], '+', { size: 24, weight: 700 }),
    ...die([234, 56], PASTEL.ciel, 'dé bleu'),
  )
}

const deuxDesQ3 = defineFigure('epreuves-q3-deux-des', deuxDes())

const urneQ4 = defineFigure(
  'epreuves-q4-urne',
  container({
    kind: 'urne',
    content: [...balls(2, 'R', ROUGE.fill), ...balls(3, 'B', BLEU.fill)],
    legend: [
      { ...ROUGE, name: 'rouge' },
      { ...BLEU, name: 'bleue' },
    ],
    radius: 16,
    perRow: 3,
  }),
)

const urneQ5 = defineFigure(
  'epreuves-q5-urne',
  container({
    kind: 'urne',
    content: [...balls(3, 'R', ROUGE.fill), ...balls(2, 'V', VERT.fill)],
    legend: [
      { ...ROUGE, name: 'rouge' },
      { ...VERT, name: 'verte' },
    ],
    radius: 16,
    perRow: 3,
  }),
)

export const donneesFigures: readonly FigureDefinition[] = [
  serieRangee,
  seriePompes,
  notesYanis,
  taillesEleves,
  butsParMatch,
  deMultipleDe3,
  deSauf6,
  deSixFaces,
  echelleProbabilites,
  sacJetons,
  urneQ2,
  roueQ4,
  cartesQ5,
  jetonsQ6,
  arbreRappel,
  tableauRappel,
  tableauSommes,
  sacSansRemise,
  deuxDesQ3,
  urneQ4,
  urneQ5,
]
