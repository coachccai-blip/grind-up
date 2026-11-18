import { stripFigure, tableFigure, UNKNOWN } from './families.js'
import {
  ACCENT,
  arrow,
  circle,
  curvedArrow,
  curvedArrowTop,
  defineFigure,
  dimension,
  dot,
  drawing,
  type Drawing,
  type FigureDefinition,
  FONT_SIZE,
  GREY,
  INK,
  type Part,
  PASTEL,
  path,
  type Point,
  polar,
  polygon,
  polyline,
  rect,
  sector,
  segment,
  text,
  textWidth,
  WHITE,
  WIDTH,
  shifted,
  withParts,
  withUnit,
} from './svg.js'

/**
 * Illustrations du thème « Proportionnalité et pourcentages ». Une figure par entrée, construite avec les
 * familles de families.ts ou les primitives de svg.ts : voir docs/bibliotheque.md,
 * « Illustrer un exercice ».
 */

/** Un dessin trop bas, centré dans la hauteur minimale. */
const padded = (base: Drawing): Drawing =>
  base.height >= 120 ? base : drawing(120, shifted(base, 0, (120 - base.height) / 2))

const euros = (value: number | string) => withUnit(value, '€')
const colorOf = (label: string) => (label.includes(UNKNOWN) ? ACCENT : INK)
const note = (where: Point, content: string, anchor: 'start' | 'middle' | 'end' = 'middle') =>
  text(where, content, { size: 13, color: GREY, anchor })

// ---------------------------------------------------------------------------
// Évolutions : des valeurs reliées par des flèches

/**
 * Des valeurs dans des boîtes, reliées par des flèches : au-dessus de chaque flèche
 * l'évolution (« + 6 % »), au-dessous, si on la donne, le coefficient (« × 1,06 »).
 */
function evolution(
  values: readonly string[],
  above: readonly string[],
  below: readonly string[] = [],
): Drawing {
  const boxWidth = (value: string) => Math.max(56, textWidth(value, FONT_SIZE, 700) + 24)
  const gap = Math.min(
    96,
    (WIDTH - 16 - values.reduce((total, value) => total + boxWidth(value), 0)) /
      Math.max(1, values.length - 1),
  )
  const total = values.reduce((sum, value) => sum + boxWidth(value), 0) + gap * (values.length - 1)
  const y = 46
  const boxHeight = 40
  const parts: Part[] = []
  let x = (WIDTH - total) / 2
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
        color: colorOf(value),
        weight: 700,
        halo: false,
        size: unknown ? 20 : FONT_SIZE,
      }),
    )
    x += width
    if (index < values.length - 1) {
      const middle = x + gap / 2
      parts.push(
        arrow([x + 6, y + boxHeight / 2], [x + gap - 6, y + boxHeight / 2], {
          color: GREY,
          width: 2,
          head: 9,
        }),
      )
      const top = above[index]
      if (top) parts.push(text([middle, y - 14], top, { weight: 700, color: colorOf(top) }))
      const bottom = below[index]
      if (bottom)
        parts.push(text([middle, y + boxHeight + 16], bottom, { weight: 700, color: ACCENT }))
      x += gap
    }
  })
  return drawing(120, ...parts)
}

/** Deux boîtes, une flèche à l'aller au-dessus, une flèche au retour au-dessous. */
function twoWay(left: string, right: string, forward: string, back: string): Drawing {
  const y = 58
  const height = 40
  const width = 136
  const leftX = 14
  const rightX = WIDTH - 14 - width
  const a: Point = [leftX + width / 2, y - 4]
  const b: Point = [rightX + width / 2, y - 4]
  const c: Point = [rightX + width / 2, y + height + 4]
  const d: Point = [leftX + width / 2, y + height + 4]
  return drawing(
    164,
    rect([leftX, y], width, height, { fill: PASTEL.citron, radius: 10 }),
    rect([rightX, y], width, height, { fill: PASTEL.menthe, radius: 10 }),
    text([leftX + width / 2, y + height / 2], left, { weight: 700, halo: false, size: 14 }),
    text([rightX + width / 2, y + height / 2], right, { weight: 700, halo: false, size: 14 }),
    curvedArrow(a, b, 16, { color: ACCENT, width: 2 }),
    text([curvedArrowTop(a, b, 16)[0], curvedArrowTop(a, b, 16)[1] - 10], forward, {
      color: ACCENT,
      weight: 700,
    }),
    curvedArrow(c, d, 16, { color: GREY, width: 2 }),
    text([curvedArrowTop(c, d, 16)[0], curvedArrowTop(c, d, 16)[1] + 10], back, {
      color: GREY,
      weight: 700,
    }),
  )
}

/** Hausse et baisse en barres : 100 %, puis 120 %, puis 85 %. */
function barresEvolution(): Drawing {
  const left = 20
  const full = 200
  const barHeight = 28
  const row = (top: number, caption: string, coefficient: string | null): Part[] => [
    text([left, top], caption, { size: 14, anchor: 'start' }),
    coefficient &&
      text([WIDTH - 12, top], coefficient, { color: ACCENT, weight: 700, anchor: 'end' }),
  ]
  const bar = (x: number, top: number, width: number, fill: string, label: string) => [
    rect([x, top], width, barHeight, { fill, width: 1.5 }),
    text([x + width / 2, top + barHeight / 2], label, { size: 14, weight: 700, halo: false }),
  ]
  return drawing(
    214,
    ...row(16, 'Prix de départ', null),
    ...bar(left, 28, full, PASTEL.lilas, '100\u00A0%'),
    ...row(80, 'Hausse de 20\u00A0%', '× 1,20'),
    ...bar(left, 92, full, PASTEL.lilas, '100\u00A0%'),
    ...bar(left + full, 92, 40, PASTEL.peche, '20\u00A0%'),
    ...row(144, 'Baisse de 15\u00A0%', '× 0,85'),
    ...bar(left, 156, 170, PASTEL.lilas, '85\u00A0%'),
    rect([left + 170, 156], 30, barHeight, { color: GREY, width: 1.5, dashed: true }),
    note([left + 185, 198], '15\u00A0% en moins'),
  )
}

// ---------------------------------------------------------------------------
// Pourcentages : des parts d'un tout

function demiPension(): Drawing {
  const base = stripFigure({
    groups: [
      { parts: 6, fill: PASTEL.peche, label: '60\u00A0%' },
      { parts: 4, fill: WHITE },
    ],
    total: '450 élèves',
  })
  return withParts(
    { height: 136, parts: base.parts },
    note([160, 124], 'Chaque case : 10\u00A0% des élèves'),
    text([300, 20], '? élèves', { color: ACCENT, weight: 700, anchor: 'end' }),
  )
}

function chorale(): Drawing {
  const base = stripFigure({
    groups: [
      { parts: 8, fill: PASTEL.menthe, label: '8 choristes' },
      { parts: 17, fill: WHITE },
    ],
    total: '25 élèves',
  })
  return withParts(
    { height: base.height + 6, parts: base.parts },
    text([300, 20], '? %', { color: ACCENT, weight: 700, anchor: 'end' }),
  )
}

// ---------------------------------------------------------------------------
// Vitesse : rappel

function triangleVitesse(): Drawing {
  const apex: Point = [84, 18]
  const bl: Point = [12, 160]
  const br: Point = [156, 160]
  const middleY = 98
  const formula = (y: number, content: string) =>
    text([184, y], content, { size: 17, weight: 700, anchor: 'start' })
  return drawing(
    196,
    polygon([apex, bl, br], { fill: PASTEL.citron }),
    segment(
      [84 - (72 * (middleY - 18)) / 142, middleY],
      [84 + (72 * (middleY - 18)) / 142, middleY],
    ),
    segment([84, middleY], [84, 160]),
    text([84, 68], 'd', { size: 24, weight: 700, halo: false }),
    text([58, 130], 'v', { size: 24, weight: 700, halo: false }),
    text([110, 130], 't', { size: 24, weight: 700, halo: false }),
    formula(48, 'v = d ÷ t'),
    formula(88, 'd = v × t'),
    formula(128, 't = d ÷ v'),
    note([160, 184], 'Cache la lettre cherchée : il reste le calcul.'),
  )
}

function horlogeHeure(): Drawing {
  const center: Point = [80, 100]
  const radius = 68
  const ticks: Part[] = Array.from({ length: 12 }, (_, hour) =>
    segment(
      polar(center, radius - (hour % 3 === 0 ? 10 : 6), 90 - hour * 30),
      polar(center, radius, 90 - hour * 30),
      {
        width: hour % 3 === 0 ? 2 : 1.5,
      },
    ),
  )
  const line = (y: number, minutes: string, hours: string, strong = false) =>
    text([174, y], `${minutes} = ${hours}`, {
      anchor: 'start',
      weight: strong ? 700 : 600,
      color: strong ? ACCENT : INK,
    })
  return drawing(
    196,
    circle(center, radius, { fill: WHITE }),
    sector(center, radius, 0, 90, { fill: PASTEL.peche, width: 1.5 }),
    ...ticks,
    circle(center, radius),
    segment(center, polar(center, radius - 16, 90), { width: 3 }),
    segment(center, polar(center, radius - 16, 0), { width: 3, color: ACCENT }),
    dot(center, { radius: 4 }),
    text(polar(center, 34, 45), '15\u00A0min', { size: 13, weight: 700, halo: false }),
    line(48, withUnit(15, 'min'), withUnit('0,25', 'h'), true),
    line(80, withUnit(30, 'min'), withUnit('0,5', 'h')),
    line(112, withUnit(45, 'min'), withUnit('0,75', 'h')),
    line(144, withUnit(60, 'min'), withUnit(1, 'h')),
    note([174, 178], '1\u00A0h compte 60\u00A0min', 'start'),
  )
}

// ---------------------------------------------------------------------------
// Vitesse : petites scènes de trajet

const ROAD_Y = 132

function car(x: number): Part[] {
  const y = ROAD_Y
  return [
    path(
      `M ${x} ${y - 10} L ${x} ${y - 26} Q ${x} ${y - 30} ${x + 6} ${y - 30} L ${x + 14} ${y - 30} L ${x + 22} ${y - 42} L ${x + 46} ${y - 42} L ${x + 56} ${y - 30} L ${x + 64} ${y - 29} Q ${x + 70} ${y - 28} ${x + 70} ${y - 22} L ${x + 70} ${y - 10} Z`,
      { fill: PASTEL.ciel },
    ),
    polygon(
      [
        [x + 18, y - 31],
        [x + 25, y - 39],
        [x + 34, y - 39],
        [x + 34, y - 31],
      ],
      { fill: WHITE, width: 1.5 },
    ),
    polygon(
      [
        [x + 38, y - 31],
        [x + 38, y - 39],
        [x + 45, y - 39],
        [x + 51, y - 31],
      ],
      { fill: WHITE, width: 1.5 },
    ),
    circle([x + 16, y - 8], 7, { fill: INK }),
    circle([x + 54, y - 8], 7, { fill: INK }),
    circle([x + 16, y - 8], 2.5, { fill: WHITE, color: WHITE }),
    circle([x + 54, y - 8], 2.5, { fill: WHITE, color: WHITE }),
  ]
}

function runner(x: number): Part[] {
  const y = ROAD_Y
  return [
    circle([x + 30, y - 64], 7, { fill: PASTEL.peche }),
    polyline(
      [
        [x + 28, y - 55],
        [x + 22, y - 30],
      ],
      { width: 3 },
    ),
    polyline(
      [
        [x + 27, y - 50],
        [x + 14, y - 42],
        [x + 8, y - 48],
      ],
      { width: 2.5 },
    ),
    polyline(
      [
        [x + 27, y - 50],
        [x + 38, y - 44],
        [x + 46, y - 52],
      ],
      { width: 2.5 },
    ),
    polyline(
      [
        [x + 22, y - 30],
        [x + 10, y - 16],
        [x + 2, y - 4],
      ],
      { width: 2.5 },
    ),
    polyline(
      [
        [x + 22, y - 30],
        [x + 34, y - 18],
        [x + 32, y - 2],
      ],
      { width: 2.5 },
    ),
  ]
}

function cyclist(x: number): Part[] {
  const y = ROAD_Y
  const back: Point = [x + 14, y - 15]
  const front: Point = [x + 62, y - 15]
  const pedal: Point = [x + 34, y - 15]
  const seat: Point = [x + 28, y - 38]
  const bar: Point = [x + 54, y - 38]
  return [
    circle(back, 14, { width: 2 }),
    circle(front, 14, { width: 2 }),
    polyline([back, pedal, seat, back], { width: 2, color: ACCENT }),
    polyline([pedal, bar, front], { width: 2, color: ACCENT }),
    segment(seat, bar, { width: 2, color: ACCENT }),
    // La cycliste.
    circle([x + 44, y - 70], 7, { fill: PASTEL.peche }),
    polyline(
      [
        [x + 28, y - 42],
        [x + 40, y - 62],
      ],
      { width: 3 },
    ),
    polyline(
      [
        [x + 38, y - 58],
        [x + 54, y - 42],
      ],
      { width: 2.5 },
    ),
    polyline([[x + 28, y - 42], [x + 40, y - 30], pedal], { width: 2.5 }),
  ]
}

interface Trip {
  rider: Part[]
  /** Ce qui s'écrit sous la route, sur toute sa longueur : la distance. */
  distance: string
  /** Les deux lignes en haut à droite : durée et vitesse. */
  lines: readonly [string, string]
}

/** Une route, un véhicule au départ, un drapeau à l'arrivée, et les données du trajet. */
function trip({ rider, distance, lines }: Trip): Drawing {
  const start = 20
  const end = 300
  return drawing(
    186,
    segment([start, ROAD_Y], [end, ROAD_Y], { color: GREY, width: 5 }),
    ...rider,
    segment([290, ROAD_Y], [290, ROAD_Y - 50], { width: 2 }),
    polygon(
      [
        [290, ROAD_Y - 50],
        [312, ROAD_Y - 43],
        [290, ROAD_Y - 36],
      ],
      { fill: PASTEL.rose, width: 1.5 },
    ),
    dimension([start, ROAD_Y + 4], [290, ROAD_Y + 4], '', { offset: 18, outside: [160, 0] }),
    text([155, ROAD_Y + 38], distance, { weight: 700, color: colorOf(distance) }),
    text([270, 30], lines[0], { weight: 700, anchor: 'end', color: colorOf(lines[0]) }),
    text([270, 56], lines[1], { weight: 700, anchor: 'end', color: colorOf(lines[1]) }),
  )
}

/** Le trajet des vacances : 2 h d'autoroute, puis 1 h de route de campagne. */
function vacances(): Drawing {
  const start = 20
  const split = 214
  const end = 300
  return drawing(
    190,
    segment([start, ROAD_Y], [split, ROAD_Y], { color: GREY, width: 7 }),
    segment([split, ROAD_Y], [end, ROAD_Y], { color: PASTEL.anis, width: 7 }),
    segment([split, ROAD_Y], [end, ROAD_Y], { color: GREY, width: 1.5, dashed: true }),
    dot([split, ROAD_Y], { radius: 5 }),
    ...car(24),
    text([150, 40], 'autoroute', { size: 13, color: GREY }),
    text([150, 60], '2\u00A0h à 110\u00A0km/h', { weight: 700 }),
    text([258, 82], 'campagne', { size: 13, color: GREY }),
    text([258, 102], '1\u00A0h à 50\u00A0km/h', { weight: 700, size: 14 }),
    dimension([start, ROAD_Y + 4], [end, ROAD_Y + 4], '', { offset: 18, outside: [160, 0] }),
    text([160, ROAD_Y + 40], 'vitesse moyenne : ?', { weight: 700, color: ACCENT }),
  )
}

// ---------------------------------------------------------------------------
// Ratios, partages, échelles

/** Bande d'un partage, avec la part cherchée marquée « ? » au milieu de son groupe. */
function partage(
  groups: readonly { parts: number; fill: string; label: string; asked?: boolean }[],
  total?: string,
  caption?: string,
): Drawing {
  const base = stripFigure({ groups, total })
  const count = groups.reduce((sum, group) => sum + group.parts, 0)
  const partWidth = 280 / count
  const marks: Part[] = []
  let index = 0
  for (const group of groups) {
    if (group.asked) {
      marks.push(
        text([20 + (index + group.parts / 2) * partWidth, 34 + 22], UNKNOWN, {
          size: 22,
          color: ACCENT,
          weight: 700,
          halo: false,
        }),
      )
    }
    index += group.parts
  }
  const height = caption ? base.height + 14 : base.height
  return withParts(
    { height, parts: base.parts },
    ...marks,
    caption && note([160, height - 14], caption),
  )
}

function echelleRappel(): Drawing {
  const map: Point = [16, 18]
  return drawing(
    176,
    rect(map, 132, 104, { fill: PASTEL.anis, radius: 6, width: 1.5 }),
    path(`M 36 100 Q 60 60 90 72 T 130 40`, { color: GREY, width: 2, dashed: true }),
    dot([36, 100]),
    dot([130, 40]),
    // La barre d'échelle : 1 cm sur la carte.
    segment([28, 140], [78, 140], { width: 3 }),
    segment([28, 134], [28, 146], { width: 2 }),
    segment([78, 134], [78, 146], { width: 2 }),
    text([53, 160], '1\u00A0cm', { weight: 700 }),
    text([238, 30], 'échelle 1/50\u202F000', { weight: 700 }),
    text([238, 64], '1\u00A0cm sur la carte', { size: 14 }),
    arrow([238, 76], [238, 100], { color: ACCENT, width: 2 }),
    text([248, 88], '× 50\u202F000', { size: 13, color: ACCENT, weight: 700, anchor: 'start' }),
    text([238, 114], '50\u202F000\u00A0cm en vrai', { size: 14 }),
    text([238, 140], 'soit 500\u00A0m', { weight: 700, color: ACCENT }),
  )
}

function refuge(x: number, y: number): Part[] {
  return [
    polygon(
      [
        [x - 10, y],
        [x, y - 11],
        [x + 10, y],
      ],
      { fill: PASTEL.peche, width: 1.5 },
    ),
    rect([x - 7, y], 14, 10, { fill: WHITE, width: 1.5 }),
  ]
}

function carteRefuges(): Drawing {
  const a: Point = [62, 116]
  const b: Point = [250, 116]
  return drawing(
    200,
    rect([10, 12], 300, 176, { fill: PASTEL.anis, radius: 8, width: 1.5 }),
    polygon(
      [
        [104, 92],
        [134, 46],
        [160, 80],
        [176, 62],
        [210, 92],
      ],
      { fill: WHITE, color: GREY, width: 1.5 },
    ),
    path(`M ${a[0]} ${a[1] + 6} Q 120 150 160 120 T ${b[0]} ${b[1] + 6}`, {
      color: GREY,
      width: 2,
      dashed: true,
    }),
    ...refuge(a[0], a[1]),
    ...refuge(b[0], b[1]),
    dimension([a[0], 150], [b[0], 150], '', { offset: 0 }),
    text([156, 164], withUnit(6, 'cm'), { weight: 700 }),
    text([24, 32], 'échelle 1/25\u202F000', { size: 14, weight: 700, anchor: 'start' }),
    text([300, 32], 'en vrai : ?', { color: ACCENT, weight: 700, anchor: 'end' }),
  )
}

export const proportionnaliteFigures: readonly FigureDefinition[] = [
  // Pourcentages et évolutions.
  defineFigure('pourcentages-rappel-barres', barresEvolution()),
  defineFigure(
    'pourcentages-rappel-coefficient',
    twoWay('valeur de départ', 'valeur d’arrivée', '× coefficient', '÷ coefficient'),
  ),
  defineFigure(
    'pourcentages-ex-pull',
    evolution([euros(40), UNKNOWN], ['− 15\u00A0%'], ['× 0,85']),
  ),
  defineFigure(
    'pourcentages-ex-loyer',
    evolution([UNKNOWN, euros(630)], ['+ 5\u00A0%'], ['× 1,05']),
  ),
  defineFigure('pourcentages-q1-demi-pension', demiPension()),
  defineFigure('pourcentages-q2-chorale', chorale()),
  defineFigure('pourcentages-q3-abonnement', evolution([euros(350), UNKNOWN], ['+ 6\u00A0%'])),
  defineFigure('pourcentages-q4-club', evolution(['160 adhérents', '200 adhérents'], ['+ ? %'])),
  defineFigure('pourcentages-q5-blouson', evolution([UNKNOWN, euros(68)], ['− 20\u00A0%'])),
  defineFigure(
    'pourcentages-q6-telephone',
    evolution([euros(300), '…', UNKNOWN], ['+ 20\u00A0%', '− 20\u00A0%']),
  ),
  // Vitesse, durée, distance.
  defineFigure('vitesse-rappel-triangle', triangleVitesse()),
  defineFigure('vitesse-rappel-heure', horlogeHeure()),
  defineFigure('vitesse-rappel-conversion', twoWay('m/s', 'km/h', '× 3,6', '÷ 3,6')),
  defineFigure(
    'vitesse-ex-car',
    trip({
      rider: car(28),
      distance: withUnit(105, 'km'),
      lines: ['durée : 1\u00A0h 30\u00A0min', 'vitesse : ?'],
    }),
  ),
  defineFigure(
    'vitesse-q2-voiture',
    trip({
      rider: car(28),
      distance: withUnit(150, 'km'),
      lines: ['durée : 2\u00A0h 30\u00A0min', 'vitesse : ?'],
    }),
  ),
  defineFigure(
    'vitesse-q3-coureur',
    trip({
      rider: runner(34),
      distance: 'distance : ?',
      lines: ['durée : 45\u00A0min', 'vitesse : 12\u00A0km/h'],
    }),
  ),
  defineFigure(
    'vitesse-q4-cycliste',
    trip({
      rider: cyclist(24),
      distance: withUnit(10, 'km'),
      lines: ['vitesse : 25\u00A0km/h', 'durée : ? min'],
    }),
  ),
  defineFigure('vitesse-q6-vacances', vacances()),
  // Ratios, partages et échelles.
  defineFigure(
    'ratios-rappel-tableau',
    tableFigure({
      rows: [
        { label: 'Longueur (m)', values: ['4', '6'] },
        { label: 'Prix (€)', values: ['10', '15'] },
      ],
      factor: { label: '× 2,5' },
      columnArrows: [{ from: 0, to: 1, label: '× 1,5' }],
    }),
  ),
  defineFigure(
    'ratios-rappel-bande',
    partage(
      [
        { parts: 2, fill: PASTEL.lilas, label: '2 parts' },
        { parts: 3, fill: PASTEL.peche, label: '3 parts' },
      ],
      undefined,
      'Ratio 2:3 : toutes les parts sont égales.',
    ),
  ),
  defineFigure('ratios-rappel-echelle', echelleRappel()),
  defineFigure(
    'ratios-ex-billes',
    partage(
      [
        { parts: 3, fill: PASTEL.lilas, label: 'Adam' },
        { parts: 4, fill: PASTEL.peche, label: 'Inès' },
      ],
      '56 billes',
    ),
  ),
  defineFigure(
    'ratios-q1-tableau',
    padded(
      tableFigure({
        rows: [
          { label: 'Masse (kg)', values: ['3', '5'] },
          { label: 'Prix (€)', values: ['7,50', UNKNOWN] },
        ],
      }),
    ),
  ),
  defineFigure(
    'ratios-q2-judo',
    partage(
      [
        { parts: 2, fill: PASTEL.lilas, label: 'filles' },
        { parts: 3, fill: PASTEL.menthe, label: 'garçons' },
      ],
      undefined,
      'Ratio 2:3 : 2 parts de filles pour 3 parts de garçons.',
    ),
  ),
  defineFigure(
    'ratios-q3-partage',
    partage(
      [
        { parts: 2, fill: PASTEL.lilas, label: 'Léo' },
        { parts: 3, fill: PASTEL.peche, label: 'Jade', asked: true },
      ],
      euros(60),
    ),
  ),
  defineFigure(
    'ratios-q4-partage',
    partage(
      [
        { parts: 2, fill: PASTEL.lilas, label: 'Ali' },
        { parts: 3, fill: PASTEL.menthe, label: 'Bianca' },
        { parts: 5, fill: PASTEL.peche, label: 'Chloé', asked: true },
      ],
      euros(90),
    ),
  ),
  defineFigure('ratios-q5-carte', carteRefuges()),
  defineFigure(
    'ratios-q6-recette',
    padded(
      tableFigure({
        rows: [
          { label: 'Personnes', values: ['4', '10'] },
          { label: 'Farine (g)', values: ['250', UNKNOWN] },
        ],
      }),
    ),
  ),
]
