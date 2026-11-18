import { stripFigure, treeFigure, UNKNOWN } from './families.js'
import {
  ACCENT,
  arrow,
  brace,
  circle,
  curvedArrow,
  dashed,
  defineFigure,
  drawing,
  ellipse,
  type FigureDefinition,
  GREY,
  INK,
  lengthLabel,
  type Part,
  PASTEL,
  type Point,
  polygon,
  rect,
  rightAngle,
  segment,
  text,
  withParts,
  withUnit,
} from './svg.js'

/**
 * Illustrations du thème « Nombres et calculs ». Une figure par entrée, construite avec les
 * familles de families.ts ou les primitives de svg.ts : voir docs/bibliotheque.md,
 * « Illustrer un exercice ».
 */

/** Espace fine insécable, entre les tranches de trois chiffres. */
const THIN = '\u202F'
/** Un entier écrit par tranches de trois chiffres : « 1 390 000 ». */
const grouped = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, THIN)

// ---------------------------------------------------------------------------
// Fractions

/**
 * 1/2 + 1/3 : chaque bande est redécoupée en sixièmes. Les traits pleins sont
 * les parts de départ, les pointillés le nouveau découpage.
 */
function memeDenominateur() {
  const left = 64
  const cell = 28
  const width = cell * 6
  const barHeight = 34
  const rows: {
    y: number
    name: string
    every: number
    groups: readonly (readonly [number, string])[]
    sixths: string
  }[] = [
    { y: 30, name: '1/2', every: 3, groups: [[3, PASTEL.peche]], sixths: '3/6' },
    { y: 76, name: '1/3', every: 2, groups: [[2, PASTEL.menthe]], sixths: '2/6' },
    {
      y: 134,
      name: 'somme',
      every: 6,
      groups: [
        [3, PASTEL.peche],
        [2, PASTEL.menthe],
      ],
      sixths: '5/6',
    },
  ]
  const parts: Part[] = [
    text([left + width + 34, 12], 'en sixièmes', { size: 13, color: GREY }),
    segment([left - 50, 122], [left + width + 56, 122], { color: GREY, width: 1.5 }),
  ]
  for (const { y, name, every, groups, sixths } of rows) {
    let index = 0
    for (const [count, fill] of groups) {
      parts.push(rect([left + index * cell, y], count * cell, barHeight, { fill, width: 0 }))
      index += count
    }
    for (let cut = 1; cut < 6; cut++) {
      const x = left + cut * cell
      parts.push(
        cut % every === 0
          ? segment([x, y], [x, y + barHeight])
          : dashed([x, y], [x, y + barHeight], { width: 1.5 }),
      )
    }
    parts.push(
      rect([left, y], width, barHeight),
      text([left - 10, y + barHeight / 2], name, { weight: 700, anchor: 'end' }),
      text([left + width + 34, y + barHeight / 2], sixths, { weight: 700 }),
    )
  }
  return drawing(182, ...parts)
}

const fractionsMemeDenominateur = defineFigure('fractions-meme-denominateur', memeDenominateur())

/** Les 2/3 de 60 : on partage 60 en 3 parts de 20, puis on en prend 2. */
const fractionsDUneQuantite = defineFigure(
  'fractions-d-une-quantite',
  withParts(
    stripFigure({
      groups: [{ parts: 2, fill: PASTEL.peche, label: '2/3 de 60 : 40' }, { parts: 1 }],
      total: '60',
    }),
    ...[0, 1, 2].map((part) =>
      text([20 + (280 / 3) * (part + 0.5), 56], '20', { weight: 700, halo: false }),
    ),
  ),
)

/**
 * Le problème de Léa : la somme de départ, dont 1/4 part pour le livre ; puis
 * le reste, agrandi et partagé en cinq, dont 2/5 partent pour le jeu. Ce qui
 * reste à la fin est la question : on ne l'écrit pas en fraction.
 */
function lea() {
  const left = 20
  const width = 280
  const quarter = width / 4
  const fifth = width / 5
  const top = 34
  const barHeight = 42
  const lower = 120
  const parts: Part[] = [
    text([160, 14], 'la somme de départ', { size: 14, color: GREY }),
    rect([left, top], quarter, barHeight, { fill: PASTEL.peche, width: 0 }),
    ...[1, 2, 3].map((cut) =>
      segment([left + cut * quarter, top], [left + cut * quarter, top + barHeight], { width: 1.5 }),
    ),
    rect([left, top], width, barHeight),
    text([left + quarter / 2, top + 13], 'livre', { size: 14, weight: 700, halo: false }),
    text([left + quarter / 2, top + 30], '1/4', { size: 14, weight: 700, halo: false }),
    // Le reste, agrandi.
    dashed([left + quarter, top + barHeight], [left, lower]),
    dashed([left + width, top + barHeight], [left + width, lower]),
    text([175, 98], 'le reste', { size: 14, color: GREY }),
    rect([left, lower], 2 * fifth, barHeight, { fill: PASTEL.menthe, width: 0 }),
    ...[1, 2, 3, 4].map((cut) =>
      segment([left + cut * fifth, lower], [left + cut * fifth, lower + barHeight], {
        width: 1.5,
      }),
    ),
    rect([left, lower], width, barHeight),
    brace([left, lower + barHeight], [left + 2 * fifth, lower + barHeight], 'jeu : 2/5 du reste', {
      outside: [160, lower],
    }),
    brace([left + 2 * fifth, lower + barHeight], [left + width, lower + barHeight], 'à la fin ?', {
      outside: [160, lower],
      labelColor: ACCENT,
    }),
  ]
  return drawing(200, ...parts)
}

const fractionsLea = defineFigure('fractions-lea-barre', lea())

// ---------------------------------------------------------------------------
// Puissances

/** L'échelle des puissances de 10, de 10⁻³ à 10⁶, avec leur écriture décimale. */
function echelle() {
  const rows: readonly (readonly [string, string])[] = [
    ['10⁶', grouped('1000000')],
    ['10⁵', grouped('100000')],
    ['10⁴', grouped('10000')],
    ['10³', grouped('1000')],
    ['10²', '100'],
    ['10¹', '10'],
    ['10⁰', '1'],
    ['10⁻¹', '0,1'],
    ['10⁻²', '0,01'],
    ['10⁻³', '0,001'],
  ]
  const top = 12
  const step = 23
  const y = (index: number) => top + step * (index + 0.5)
  const parts: Part[] = [
    rect([40, top + step * 6], 176, step, { fill: PASTEL.citron, width: 0, radius: 6 }),
    rect([40, top + step * 7], 176, step * 3, { fill: PASTEL.ciel, width: 0, radius: 6 }),
    ...rows.flatMap(([power, decimal], index) => [
      text([100, y(index)], power, { weight: 700, anchor: 'end', halo: false }),
      text([114, y(index)], '=', { color: GREY, halo: false }),
      text([128, y(index)], decimal, { anchor: 'start', halo: false }),
    ]),
    arrow([238, y(9)], [238, y(0)], { color: ACCENT, width: 1.75 }),
    text([250, y(2)], '× 10', { weight: 700, color: ACCENT, anchor: 'start' }),
    arrow([298, y(0)], [298, y(9)], { color: GREY, width: 1.75 }),
    text([286, y(7)], '÷ 10', { weight: 700, color: GREY, anchor: 'end' }),
  ]
  return drawing(top + step * 10 + 12, ...parts)
}

const puissancesEchelle = defineFigure('puissances-echelle-de-10', echelle())

interface CommaShift {
  /** L'écriture scientifique et l'écriture décimale, en tête de ligne. */
  title: string
  /** Les chiffres écrits, de gauche à droite ; les zéros ajoutés sont en gris. */
  digits: readonly string[]
  added: readonly number[]
  /** Place de la virgule avant et après (après le chiffre de rang donné, à partir de 0). */
  from: number
  to: number
  caption: string
}

/** La virgule saute de rang en rang : multiplier par 10ⁿ la décale de n rangs. */
function commaShift({ title, digits, added, from, to, caption }: CommaShift, top: number) {
  const step = 28
  const first = 160 - (step * (digits.length - 1)) / 2
  const x = (index: number) => first + step * index
  const y = top + 54
  const comma = (after: number) => x(after) + step / 2
  const hops: Part[] = []
  const direction = to > from ? 1 : -1
  for (let at = from; at !== to; at += direction) {
    hops.push(
      curvedArrow([comma(at), y - 14], [comma(at + direction), y - 14], 9 * direction, {
        color: ACCENT,
        width: 1.5,
        head: 7,
      }),
    )
  }
  return [
    text([160, top + 12], title, { weight: 700 }),
    ...digits.map((digit, index) =>
      text([x(index), y], digit, {
        size: 20,
        weight: 700,
        color: added.includes(index) ? GREY : INK,
        halo: false,
      }),
    ),
    text([comma(from), y + 6], ',', { size: 20, weight: 700, color: GREY, halo: false }),
    text([comma(to), y + 6], ',', { size: 20, weight: 700, color: ACCENT, halo: false }),
    ...hops,
    text([160, y + 26], caption, { size: 13, color: GREY }),
  ]
}

const puissancesVirgule = defineFigure(
  'puissances-decalage-virgule',
  drawing(
    222,
    ...commaShift(
      {
        title: `5,3 × 10³ = 5${THIN}300`,
        digits: ['5', '3', '0', '0'],
        added: [2, 3],
        from: 0,
        to: 3,
        caption: '× 10³ : la virgule avance de 3 rangs',
      },
      0,
    ),
    segment([40, 108], [280, 108], { color: PASTEL.lilas, width: 1.5 }),
    ...commaShift(
      {
        title: '2,6 × 10⁻³ = 0,0026',
        digits: ['0', '0', '0', '2', '6'],
        added: [0, 1, 2],
        from: 3,
        to: 0,
        caption: '× 10⁻³ : la virgule recule de 3 rangs',
      },
      112,
    ),
  ),
)

/** Le Soleil et un globule rouge, avec leurs diamètres : une scène, pas à l'échelle. */
function soleilGlobule() {
  const sun: Point = [92, 104]
  const radius = 62
  const cell: Point = [244, 104]
  return drawing(
    214,
    circle(sun, radius, { fill: PASTEL.citron }),
    arrow([sun[0] - radius + 4, sun[1]], [sun[0] + radius - 4, sun[1]], {
      both: true,
      color: GREY,
      width: 1.5,
      head: 7,
    }),
    text([sun[0], 24], 'Soleil', { weight: 700 }),
    text([sun[0], sun[1] + radius + 18], withUnit(grouped('1390000'), 'km'), { weight: 700 }),
    circle(cell, 20, { fill: PASTEL.rose }),
    arrow([cell[0] - 18, cell[1]], [cell[0] + 18, cell[1]], {
      both: true,
      color: GREY,
      width: 1.5,
      head: 6,
    }),
    text([cell[0], 24], 'globule rouge', { weight: 700 }),
    text([cell[0], sun[1] + radius + 18], withUnit('0,000007', 'm'), { weight: 700 }),
    text([160, 204], 'diamètres, schéma pas à l’échelle', { size: 13, color: GREY }),
  )
}

const puissancesSoleil = defineFigure('puissances-soleil-globule', soleilGlobule())

/** La lumière en une seconde, puis en une année : la distance cherchée est « ? ». */
function anneeLumiere() {
  const star: Point = [34, 92]
  return drawing(
    176,
    circle(star, 24, { fill: PASTEL.citron }),
    text([star[0], 50], 'étoile', { size: 13, color: GREY }),
    arrow([64, 78], [118, 78], { width: 1.75 }),
    text([128, 78], `${withUnit('3 × 10⁵', 'km')} en 1 s`, { anchor: 'start', weight: 700 }),
    arrow([64, 112], [304, 112], { color: ACCENT, width: 2 }),
    text([184, 134], 'en 1 an, soit 3,2 × 10⁷ s', { weight: 700 }),
    text([184, 158], `distance : ${withUnit(UNKNOWN, 'km')}`, { weight: 700, color: ACCENT }),
  )
}

const puissancesAnneeLumiere = defineFigure('puissances-annee-lumiere', anneeLumiere())

// ---------------------------------------------------------------------------
// Racines carrées

/** Un carré d'aire a a pour côté √a ; un carré d'aire 49 a pour côté 7. */
function carreAire() {
  const size = 96
  const top = 22
  const square = (left: number, inside: string, sideLabel: string, fill: string): Part[] => [
    rect([left, top], size, size, { fill }),
    text([left + size / 2, top + size / 2], inside, { size: 17, weight: 700, halo: false }),
    text([left + size / 2, top + size + 14], sideLabel, { weight: 700, color: ACCENT }),
    text([left - 8, top + size / 2], sideLabel, { weight: 700, color: ACCENT, anchor: 'end' }),
  ]
  return drawing(
    150,
    ...square(48, 'aire a', '√a', PASTEL.lilas),
    ...square(196, 'aire 49', '7', PASTEL.menthe),
  )
}

const racinesCarreAire = defineFigure('racines-carre-aire', carreAire())

/** Deux droites graduées : 36 < 40 < 49 en haut, 6 < √40 < 7 en bas. */
function encadrement() {
  const x = (value: number) => 56 + (value - 33) * 13.5
  const upper = 52
  const lower = 128
  const marks: readonly (readonly [number, string, string, boolean])[] = [
    [36, '36', '6', false],
    [40, '40', '√40', true],
    [49, '49', '7', false],
  ]
  return drawing(
    174,
    text([22, upper], 'a', { weight: 700, color: GREY }),
    text([22, lower], '√a', { weight: 700, color: GREY }),
    arrow([44, upper], [304, upper], { width: 1.5, head: 8 }),
    arrow([44, lower], [304, lower], { width: 1.5, head: 8 }),
    ...marks.flatMap(([value, top, bottom, highlight]) => {
      const color = highlight ? ACCENT : INK
      return [
        segment([x(value), upper - 6], [x(value), upper + 6], { color, width: 2 }),
        segment([x(value), lower - 6], [x(value), lower + 6], { color, width: 2 }),
        text([x(value), upper - 18], top, { weight: 700, color }),
        text([x(value), lower + 20], bottom, { weight: 700, color }),
        arrow([x(value), upper + 12], [x(value), lower - 12], {
          color: highlight ? ACCENT : GREY,
          width: 1.5,
          head: 7,
          dashed: !highlight,
        }),
      ]
    }),
    text([x(44.5), (upper + lower) / 2], 'racine carrée', { size: 13, color: GREY }),
  )
}

const racinesEncadrement = defineFigure('racines-encadrement-40', encadrement())

/**
 * √(36 + 64) : dans le triangle rectangle de côtés 6 et 8, l'hypoténuse mesure
 * 10. Le détour par les deux côtés de l'angle droit, 6 + 8, est plus long.
 */
function sommeTriangle() {
  const a: Point = [70, 22]
  const b: Point = [70, 142]
  const c: Point = [230, 142]
  const center: Point = [123, 102]
  return drawing(
    222,
    polygon([a, b, c], { fill: PASTEL.lilas }),
    rightAngle(b, a, c),
    lengthLabel(a, b, '6', { outside: center, weight: 700 }),
    lengthLabel(b, c, '8', { outside: center, weight: 700 }),
    lengthLabel(c, a, '10', { outside: center, weight: 700, color: ACCENT }),
    text([160, 184], 'direct : √(36 + 64) = √100 = 10', { weight: 700, color: ACCENT }),
    text([160, 208], 'détour : 6 + 8 = 14, plus long', { color: GREY }),
  )
}

const racinesSommeTriangle = defineFigure('racines-somme-triangle', sommeTriangle())

/** Un carré d'aire 30 cm², dont le côté est cherché. */
const racinesCarre30 = defineFigure(
  'racines-carre-aire-30',
  drawing(
    164,
    rect([105, 18], 110, 110, { fill: PASTEL.lilas }),
    text([160, 73], withUnit(30, 'cm²'), { size: 17, weight: 700, halo: false }),
    text([160, 146], UNKNOWN, { size: 17, weight: 700, color: ACCENT }),
  ),
)

// ---------------------------------------------------------------------------
// Nombres premiers

/** L'arbre de décomposition de 60 : on divise par 2, par 2, puis par 3. */
const premiersArbre60 = defineFigure(
  'premiers-arbre-60',
  drawing(
    226,
    ...treeFigure({
      orientation: 'down',
      height: 190,
      root: {
        label: '60',
        children: [
          { label: '2', highlight: true },
          {
            label: '30',
            children: [
              { label: '2', highlight: true },
              {
                label: '15',
                children: [
                  { label: '3', highlight: true },
                  { label: '5', highlight: true },
                ],
              },
            ],
          },
        ],
      },
    }).parts,
    text([160, 212], '60 = 2 × 2 × 3 × 5 = 2² × 3 × 5', { weight: 700 }),
  ),
)

/** Une sucette : un disque sur un bâton. */
const lollipop = (at: Point): Part[] => [
  segment([at[0], at[1] + 10], [at[0], at[1] + 30], { color: GREY, width: 2.5 }),
  circle(at, 11, { fill: PASTEL.rose }),
  circle(at, 5, { color: INK, width: 1.5 }),
]

/** Un bonbon dans son papier : une ellipse et deux oreilles. */
const candy = (at: Point): Part[] => [
  polygon(
    [
      [at[0] - 12, at[1]],
      [at[0] - 22, at[1] - 8],
      [at[0] - 22, at[1] + 8],
    ],
    { fill: PASTEL.citron, width: 1.5 },
  ),
  polygon(
    [
      [at[0] + 12, at[1]],
      [at[0] + 22, at[1] - 8],
      [at[0] + 22, at[1] + 8],
    ],
    { fill: PASTEL.citron, width: 1.5 },
  ),
  ellipse(at, 13, 9, { fill: PASTEL.citron }),
]

/** Un sachet fermé par un lien. */
const bag = (x: number, top: number): Part[] => [
  polygon(
    [
      [x - 13, top + 8],
      [x + 13, top + 8],
      [x + 18, top + 56],
      [x - 18, top + 56],
    ],
    { fill: PASTEL.peche },
  ),
  path8(x, top),
]

/** Le haut froncé du sachet. */
const path8 = (x: number, top: number) =>
  polygon(
    [
      [x - 8, top],
      [x + 8, top],
      [x + 4, top + 8],
      [x - 4, top + 8],
    ],
    { fill: PASTEL.peche, width: 1.5 },
  )

/** La kermesse : 72 sucettes et 120 bonbons à répartir dans des sachets identiques. */
const premiersKermesse = defineFigure(
  'premiers-kermesse-sachets',
  drawing(
    168,
    ...lollipop([36, 34]),
    text([66, 44], '72 sucettes', { anchor: 'start', weight: 700 }),
    ...candy([36, 104]),
    text([66, 104], '120 bonbons', { anchor: 'start', weight: 700 }),
    arrow([162, 74], [196, 74], { color: GREY, width: 1.75 }),
    ...bag(222, 44),
    ...bag(260, 44),
    ...bag(298, 44),
    text([260, 132], '? sachets', { weight: 700, color: ACCENT }),
    text([260, 152], 'identiques', { size: 13, color: GREY }),
  ),
)

export const nombresFigures: readonly FigureDefinition[] = [
  fractionsMemeDenominateur,
  fractionsDUneQuantite,
  fractionsLea,
  puissancesEchelle,
  puissancesVirgule,
  puissancesSoleil,
  puissancesAnneeLumiere,
  racinesCarreAire,
  racinesEncadrement,
  racinesSommeTriangle,
  racinesCarre30,
  premiersArbre60,
  premiersKermesse,
]
