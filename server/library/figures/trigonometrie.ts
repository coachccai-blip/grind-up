import { polygonFigure, UNKNOWN } from './families.js'
import {
  ACCENT,
  add,
  angleMark,
  arc,
  arrow,
  circle,
  curvedArrow,
  dashed,
  defineFigure,
  dot,
  drawing,
  type Drawing,
  equalTicks,
  type FigureDefinition,
  GREY,
  INK,
  lengthLabel,
  middle,
  type Part,
  PASTEL,
  path,
  type Point,
  pointName,
  polar,
  polygon,
  rect,
  rightAngle,
  scale,
  segment,
  sub,
  text,
  textWidth,
  withParts,
  withUnit,
} from './svg.js'

/**
 * Illustrations de la trigonométrie, des agrandissements et des transformations
 * (thème « Géométrie plane »). Une figure par entrée, construite avec les
 * familles de families.ts ou les primitives de svg.ts : voir docs/bibliotheque.md,
 * « Illustrer un exercice ».
 */

const cm = (value: number) => withUnit(value, 'cm')
const m = (value: number) => withUnit(value, 'm')
const deg = (value: number) => `${value}°`

/** Étiquette dans une pastille colorée : le nom d'un côté. */
function pill(at: Point, label: string, fill: string): Part {
  const width = textWidth(label, 14, 700) + 18
  return [
    rect([at[0] - width / 2, at[1] - 12], width, 24, { fill, width: 0, radius: 12 }),
    text(at, label, { size: 14, weight: 700, halo: false }),
  ].join('')
}

// ---------------------------------------------------------------------------
// Rappel : les noms des côtés par rapport à l'angle choisi

/**
 * Triangle ABC rectangle en A. Chaque côté est surligné de sa couleur, et son
 * nom est écrit dans une pastille de la même couleur. L'angle choisi est en B,
 * ou en C pour montrer que les noms changent avec l'angle.
 */
function vocabulary(chosen: 'B' | 'C'): Drawing {
  const A: Point = [204, 184]
  const B: Point = [36, 184]
  const C: Point = [204, 44]
  const hyp = PASTEL.peche
  const [opposite, adjacent] =
    chosen === 'B' ? [PASTEL.menthe, PASTEL.ciel] : [PASTEL.ciel, PASTEL.menthe]
  const vertical = chosen === 'B' ? 'côté opposé' : 'côté adjacent'
  const horizontal = chosen === 'B' ? 'côté adjacent' : 'côté opposé'
  const vertex = chosen === 'B' ? B : C
  const [from, to] = chosen === 'B' ? [A, C] : [B, A]
  return drawing(
    232,
    polygon([A, B, C], { fill: PASTEL.lilas, width: 0 }),
    segment(B, C, { color: hyp, width: 11 }),
    segment(A, C, { color: opposite, width: 11 }),
    segment(A, B, { color: adjacent, width: 11 }),
    polygon([A, B, C]),
    rightAngle(A, B, C),
    angleMark(vertex, from, to, { radius: 30, color: ACCENT }),
    chosen === 'B'
      ? text([84, 168], 'angle choisi', { size: 14, weight: 700, color: ACCENT, anchor: 'start' })
      : text([190, 34], 'angle choisi', { size: 14, weight: 700, color: ACCENT, anchor: 'end' }),
    pill([84, 88], 'hypoténuse', hyp),
    pill([262, 114], vertical, opposite),
    pill([120, 212], horizontal, adjacent),
    pointName(A, 'A', { angle: -45 }),
    pointName(B, 'B', { angle: 200 }),
    pointName(C, 'C', { angle: 30 }),
  )
}

const vocabulaire = defineFigure('trigonometrie-vocabulaire', vocabulary('B'))
const vocabulaireAutreAngle = defineFigure('trigonometrie-vocabulaire-autre-angle', vocabulary('C'))

/** cos va de l'angle au quotient ; arccos fait le chemin inverse. */
function arccosFigure(): Drawing {
  const left: Point = [78, 74]
  const right: Point = [242, 74]
  const box = (at: Point, label: string, caption: string, fill: string) => [
    rect([at[0] - 40, at[1] - 20], 80, 40, { fill, radius: 10 }),
    text(at, label, { size: 17, weight: 700, halo: false }),
    text([at[0], at[1] + 36], caption, { size: 13, color: GREY }),
  ]
  return drawing(
    136,
    ...box(left, '60°', 'un angle', PASTEL.citron),
    ...box(right, '0,5', 'un quotient', PASTEL.menthe),
    curvedArrow([left[0] + 30, left[1] - 24], [right[0] - 30, right[1] - 24], 14, {
      color: INK,
      width: 1.75,
    }),
    text([160, 26], 'cos', { weight: 700 }),
    curvedArrow([right[0] - 44, right[1] + 8], [left[0] + 44, left[1] + 8], 0, {
      color: ACCENT,
      width: 1.75,
    }),
    text([160, 96], 'arccos', { weight: 700, color: ACCENT }),
  )
}

const arccos = defineFigure('trigonometrie-arccos', arccosFigure())

// ---------------------------------------------------------------------------
// Triangles rectangles des exemples et des questions

interface TrigTriangle {
  /** Le sommet de l'angle marqué, celui de l'angle droit, puis le troisième. */
  names: readonly [angle: string, right: string, third: string]
  /** La mesure de l'angle marqué, pour le tracé. */
  degrees: number
  /** Ce qu'on écrit dans l'angle : sa mesure, ou « ? ». */
  angleLabel: string
  adjacent?: string
  opposite?: string
  hypotenuse?: string
  /** L'angle marqué à droite plutôt qu'à gauche. */
  mirror?: boolean
  /** Le troisième sommet en bas plutôt qu'en haut. */
  flip?: boolean
  /** Rotation de tout le triangle, en degrés. */
  rotate?: number
  height?: number
}

/**
 * Triangle rectangle, l'angle choisi marqué avec sa mesure ou « ? », les
 * longueurs connues et la longueur cherchée. Les positions varient d'une
 * question à l'autre : l'élève apprend à reconnaître les côtés dans tous les sens.
 */
function trigTriangle(options: TrigTriangle): Drawing {
  const { names, degrees, angleLabel, mirror, flip, rotate = 0, height = 220 } = options
  const tangent = Math.tan((degrees * Math.PI) / 180)
  const turn = (rotate * Math.PI) / 180
  const local: Point[] = [
    [0, 0],
    [1, 0],
    [1, tangent],
  ].map(([x, y]) => {
    const px = mirror ? -x! : x!
    const py = flip ? -y! : y!
    // Rotation dans le sens des maths, puis passage à l'écran (y vers le bas).
    return [
      px * Math.cos(turn) - py * Math.sin(turn),
      -(px * Math.sin(turn) + py * Math.cos(turn)),
    ] as Point
  })
  const xs = local.map((p) => p[0])
  const ys = local.map((p) => p[1])
  const box = { left: 62, right: 258, top: 34, bottom: height - 34 }
  const factor = Math.min(
    (box.right - box.left) / (Math.max(...xs) - Math.min(...xs)),
    (box.bottom - box.top) / (Math.max(...ys) - Math.min(...ys)),
  )
  const center: Point = [
    (Math.max(...xs) + Math.min(...xs)) / 2,
    (Math.max(...ys) + Math.min(...ys)) / 2,
  ]
  const [P, R, T] = local.map((p) => add(scale(sub(p, center), factor), [160, height / 2]))
  const [angle, right, third] = names
  const sides = [
    options.adjacent && { from: angle, to: right, label: options.adjacent },
    options.opposite && { from: right, to: third, label: options.opposite },
    options.hypotenuse && { from: third, to: angle, label: options.hypotenuse },
  ].filter((side): side is { from: string; to: string; label: string } => !!side)
  return withParts(
    polygonFigure({
      height,
      vertices: [
        { name: angle, at: P! },
        { name: right, at: R! },
        { name: third, at: T! },
      ],
      rightAngles: [right],
      sides,
    }),
    angleMark(P!, R!, T!, {
      radius: degrees < 30 ? 44 : degrees < 40 ? 60 : 28,
      label: angleLabel,
      color: angleLabel === UNKNOWN ? ACCENT : INK,
    }),
  )
}

const trigo = (id: string, options: TrigTriangle) => defineFigure(id, trigTriangle(options))

const longueurFigures = [
  trigo('trigonometrie-longueur-exemple-1', {
    names: ['B', 'A', 'C'],
    degrees: 40,
    angleLabel: deg(40),
    hypotenuse: cm(9),
    adjacent: UNKNOWN,
  }),
  trigo('trigonometrie-longueur-exemple-2', {
    names: ['F', 'D', 'E'],
    degrees: 47,
    angleLabel: deg(47),
    opposite: cm(6),
    hypotenuse: UNKNOWN,
    mirror: true,
  }),
  trigo('trigonometrie-longueur-q1', {
    names: ['S', 'R', 'T'],
    degrees: 38,
    angleLabel: deg(38),
    hypotenuse: cm(10),
    adjacent: UNKNOWN,
    flip: true,
  }),
  trigo('trigonometrie-longueur-q2', {
    names: ['F', 'E', 'G'],
    degrees: 53,
    angleLabel: deg(53),
    hypotenuse: cm(7),
    opposite: UNKNOWN,
    mirror: true,
    flip: true,
  }),
  trigo('trigonometrie-longueur-q3', {
    names: ['J', 'I', 'K'],
    degrees: 35,
    angleLabel: deg(35),
    adjacent: cm(6),
    opposite: UNKNOWN,
    rotate: 90,
  }),
  trigo('trigonometrie-longueur-q4', {
    names: ['M', 'L', 'N'],
    degrees: 46,
    angleLabel: deg(46),
    adjacent: cm(5),
    hypotenuse: UNKNOWN,
    rotate: -46,
    flip: true,
  }),
  trigo('trigonometrie-longueur-q5', {
    names: ['P', 'Q', 'R'],
    degrees: 50,
    angleLabel: deg(50),
    opposite: cm(8),
    adjacent: UNKNOWN,
    mirror: true,
    rotate: -90,
  }),
]

/** La rampe [AB] monte du sol au plateau du camion ; H est au pied du plateau. */
function rampeCamion(): Drawing {
  const ground = 192
  const A: Point = [30, ground]
  const H: Point = [196, ground]
  const B: Point = [196, ground - 166 * Math.tan((20 * Math.PI) / 180)]
  const deck = B[1]
  return drawing(
    214,
    segment(A, [312, ground], { color: GREY, width: 2 }),
    // Le camion, vu de profil : caisse ouverte à l'arrière, cabine, roues.
    rect([H[0], deck - 74], 78, 74, { fill: PASTEL.citron }),
    rect([H[0], deck], 116, 16, { fill: PASTEL.ciel }),
    path(`M 278 ${deck} L 278 ${deck - 50} L 298 ${deck - 50} L 312 ${deck - 24} L 312 ${deck} Z`, {
      fill: PASTEL.ciel,
    }),
    rect([284, deck - 44], 14, 16, { fill: PASTEL.lilas, width: 1.5 }),
    circle([228, ground - 13], 13, { fill: GREY, color: INK }),
    circle([286, ground - 13], 13, { fill: GREY, color: INK }),
    // Le triangle ABH.
    polygon([A, H, B], { fill: PASTEL.lilas, width: 0 }),
    dashed(B, H, { color: INK, width: 1.5 }),
    segment(A, B, { width: 4 }),
    rightAngle(H, A, B),
    angleMark(A, H, B, { radius: 50, label: deg(20) }),
    text([182, ground - 22], m(1.2), { anchor: 'end' }),
    lengthLabel(A, B, UNKNOWN, { outside: H, color: ACCENT, weight: 700 }),
    pointName(A, 'A', { angle: 180 }),
    pointName(B, 'B', { angle: 135 }),
    pointName(H, 'H', { angle: -60 }),
  )
}

const rampe = defineFigure('trigonometrie-longueur-q6-rampe', rampeCamion())

const angleFigures = [
  trigo('trigonometrie-angle-exemple-1', {
    names: ['B', 'A', 'C'],
    degrees: 53.13,
    angleLabel: UNKNOWN,
    adjacent: cm(3),
    hypotenuse: cm(5),
  }),
  trigo('trigonometrie-angle-exemple-2', {
    names: ['E', 'D', 'F'],
    degrees: 29.05,
    angleLabel: UNKNOWN,
    adjacent: cm(9),
    opposite: cm(5),
    mirror: true,
  }),
  trigo('trigonometrie-angle-q1', {
    names: ['S', 'R', 'T'],
    degrees: 25.84,
    angleLabel: UNKNOWN,
    adjacent: cm(9),
    hypotenuse: cm(10),
    mirror: true,
    flip: true,
  }),
  trigo('trigonometrie-angle-q2', {
    names: ['F', 'E', 'G'],
    degrees: 22.02,
    angleLabel: UNKNOWN,
    opposite: cm(3),
    hypotenuse: cm(8),
    rotate: 22.02,
  }),
  trigo('trigonometrie-angle-q3', {
    names: ['J', 'I', 'K'],
    degrees: 57.99,
    angleLabel: UNKNOWN,
    adjacent: cm(5),
    opposite: cm(8),
    flip: true,
  }),
  trigo('trigonometrie-angle-q4', {
    names: ['L', 'M', 'N'],
    degrees: 34.85,
    angleLabel: UNKNOWN,
    opposite: cm(4),
    hypotenuse: cm(7),
    rotate: 90,
    mirror: true,
  }),
]

/** Le rectangle ABCD et sa diagonale [AC] ; l'angle BAC est cherché. */
function rectangleDiagonale(): Drawing {
  const A: Point = [52, 168]
  const B: Point = [268, 168]
  const C: Point = [268, 72]
  const D: Point = [52, 72]
  return drawing(
    210,
    polygon([A, B, C, D], { fill: PASTEL.lilas }),
    segment(A, C),
    rightAngle(B, A, C),
    angleMark(A, B, C, { radius: 46, label: UNKNOWN, color: ACCENT }),
    lengthLabel(A, B, cm(9), { outside: C }),
    lengthLabel(B, C, cm(4), { outside: A }),
    pointName(A, 'A', { angle: 225 }),
    pointName(B, 'B', { angle: -45 }),
    pointName(C, 'C', { angle: 45 }),
    pointName(D, 'D', { angle: 135 }),
  )
}

const rectangle = defineFigure('trigonometrie-angle-q5-rectangle', rectangleDiagonale())

/** Le garage de profil : le toit [AC] monte de A à C ; l'angle BAC est cherché. */
function garage(): Drawing {
  const ground = 198
  const A: Point = [62, 132]
  const B: Point = [222, 132]
  const C: Point = [222, 132 - 160 * 0.65]
  return drawing(
    220,
    segment([12, ground], [308, ground], { color: GREY }),
    rect([A[0], A[1]], B[0] - A[0], ground - A[1], { fill: PASTEL.citron }),
    rect([96, 150], 92, ground - 150, { fill: PASTEL.ciel, width: 1.5 }),
    ...[164, 176, 188].map((y) => segment([96, y], [188, y], { color: GREY, width: 1 })),
    polygon([A, B, C], { fill: PASTEL.lilas }),
    segment(A, C, { width: 4 }),
    rightAngle(B, A, C),
    angleMark(A, B, C, { radius: 44, label: UNKNOWN, color: ACCENT }),
    text([150, 120], m(4)),
    lengthLabel(B, C, m(2.6), { outside: A }),
    pointName(A, 'A', { angle: 160 }),
    pointName(B, 'B', { angle: 0 }),
    pointName(C, 'C', { angle: 45 }),
    text([116, 78], 'toit', { color: GREY, anchor: 'end' }),
  )
}

const toitGarage = defineFigure('trigonometrie-angle-q6-garage', garage())

// ---------------------------------------------------------------------------
// Agrandissements et réductions

/** Un rectangle et son agrandissement de rapport 2 : quatre copies de l'aire de départ. */
function aireK2(): Drawing {
  const unit = 20
  const small: Point = [50, 108]
  const big: Point = [150, 68]
  const [w, h] = [3 * unit, 2 * unit]
  const quarters: Part[] = [0, 1].flatMap((row) =>
    [0, 1].map((column) =>
      rect([big[0] + column * w, big[1] + row * h], w, h, { fill: PASTEL.menthe, width: 0 }),
    ),
  )
  return drawing(
    226,
    rect(small, w, h, { fill: PASTEL.menthe }),
    text([small[0] + w / 2, small[1] - 12], cm(3)),
    text([small[0] - 8, small[1] + h / 2], cm(2), { anchor: 'end' }),
    ...quarters,
    dashed([big[0] + w, big[1]], [big[0] + w, big[1] + 2 * h], { width: 1.5 }),
    dashed([big[0], big[1] + h], [big[0] + 2 * w, big[1] + h], { width: 1.5 }),
    rect(big, 2 * w, 2 * h),
    text([big[0] + w, big[1] - 12], cm(6)),
    text([big[0] + 2 * w + 8, big[1] + h], cm(4), { anchor: 'start' }),
    arrow([small[0] + w + 8, 128], [big[0] - 8, 128], { color: ACCENT, width: 1.75, head: 8 }),
    text([(small[0] + w + big[0]) / 2, 112], '× 2', { weight: 700, color: ACCENT }),
    text([small[0] + w / 2, 176], 'aire 6 cm²', { size: 14 }),
    text([big[0] + w, 176], 'aire 24 cm²', { size: 14 }),
    text([160, 206], 'longueurs × 2, aire × 2², soit × 4', { weight: 700, color: ACCENT }),
  )
}

const aire = defineFigure('agrandissement-aire-k2', aireK2())

/** Exemple : le rectangle de 5 cm sur 2 cm et son agrandissement de rapport 3. */
function exempleRectangle(): Drawing {
  const unit = 11
  const big: Point = [140, 36]
  const small: Point = [46, 36 + (6 * unit - 2 * unit) / 2]
  return drawing(
    128,
    rect(small, 5 * unit, 2 * unit, { fill: PASTEL.menthe }),
    text([small[0] + 2.5 * unit, small[1] - 12], cm(5)),
    text([small[0] - 6, small[1] + unit], cm(2), { anchor: 'end' }),
    rect(big, 15 * unit, 6 * unit, { fill: PASTEL.menthe }),
    arrow([small[0] + 5 * unit + 6, 69], [big[0] - 6, 69], { color: ACCENT, width: 1.75, head: 8 }),
    text([(small[0] + 5 * unit + big[0]) / 2, 54], '× 3', { weight: 700, color: ACCENT }),
    text([big[0] + 7.5 * unit, big[1] + 3 * unit - 11], 'périmètre ?', {
      weight: 700,
      color: ACCENT,
      halo: false,
    }),
    text([big[0] + 7.5 * unit, big[1] + 3 * unit + 11], 'aire ?', {
      weight: 700,
      color: ACCENT,
      halo: false,
    }),
  )
}

const exempleAgrandissement = defineFigure('agrandissement-exemple-rectangle', exempleRectangle())

/** Question 1 : ABC et son agrandissement DEF ; [EF] est cherché. */
function trianglesSemblables(): Drawing {
  const direction: Point = [Math.cos((110 * Math.PI) / 180), -Math.sin((110 * Math.PI) / 180)]
  const triangle = (origin: Point, unit: number): [Point, Point, Point] => [
    add(origin, scale(direction, 4 * unit)),
    origin,
    add(origin, [6 * unit, 0]),
  ]
  const [A, B, C] = triangle([46, 176], 10)
  const [D, E, F] = triangle([152, 176], 23)
  const small = polygonFigure({
    height: 214,
    vertices: [
      { name: 'A', at: A },
      { name: 'B', at: B },
      { name: 'C', at: C },
    ],
    sides: [
      { from: 'A', to: 'B', label: cm(4) },
      { from: 'B', to: 'C', label: cm(6) },
    ],
  })
  const large = polygonFigure({
    height: 214,
    fill: PASTEL.peche,
    vertices: [
      { name: 'D', at: D },
      { name: 'E', at: E },
      { name: 'F', at: F },
    ],
    sides: [
      { from: 'D', to: 'E', label: cm(10) },
      { from: 'E', to: 'F', label: UNKNOWN },
    ],
  })
  return drawing(214, ...small.parts, ...large.parts)
}

const semblables = defineFigure('agrandissement-q1-triangles', trianglesSemblables())

/** Silhouette d'une bouteille posée en `base` (milieu du fond), de hauteur `h`. */
function bottle(base: Point, h: number): Part {
  const [x, y] = base
  const body = h * 0.2
  const neck = h * 0.08
  const shoulder = y - h * 0.62
  const neckStart = y - h * 0.78
  const top = y - h
  const d = [
    `M ${x - body} ${y}`,
    `L ${x - body} ${shoulder}`,
    `Q ${x - body} ${neckStart} ${x - neck} ${neckStart}`,
    `L ${x - neck} ${top}`,
    `L ${x + neck} ${top}`,
    `L ${x + neck} ${neckStart}`,
    `Q ${x + body} ${neckStart} ${x + body} ${shoulder}`,
    `L ${x + body} ${y}`,
    'Z',
  ].join(' ')
  return [
    path(d, { fill: PASTEL.ciel }),
    rect([x - neck - 2, top - 2], 2 * neck + 4, h * 0.07, { fill: PASTEL.peche, width: 1.5 }),
  ].join('')
}

function bouteilles(): Drawing {
  const ground = 178
  return drawing(
    226,
    segment([30, ground], [290, ground], { color: GREY }),
    bottle([96, ground], 150),
    bottle([226, ground], 75),
    text([96, 194], 'bouteille', { size: 13, color: GREY }),
    text([96, 212], withUnit(800, 'mL'), { weight: 700 }),
    text([226, 194], 'échantillon', { size: 13, color: GREY }),
    text([226, 212], UNKNOWN, { weight: 700, color: ACCENT }),
    curvedArrow([132, 88], [206, 88], 14, { color: ACCENT, width: 1.75 }),
    text([169, 60], 'rapport 0,5', { weight: 700, color: ACCENT }),
  )
}

const bouteille = defineFigure('agrandissement-q4-bouteille', bouteilles())

// ---------------------------------------------------------------------------
// Transformations

/** Le petit drapeau triangulaire des vignettes, posé par son coin `at`. */
const flag = (at: Point, u: Point, v: Point, k = 1): Point[] => [
  at,
  add(at, scale(u, 30 * k)),
  add(at, scale(v, 18 * k)),
]

const original = (points: Point[]) => polygon(points, { fill: PASTEL.lilas })
const image = (points: Point[]) => polygon(points, { fill: PASTEL.peche })

/** Symétrie axiale, symétrie centrale et translation, côte à côte. */
function vignettesIsometries(): Drawing {
  const caption = (x: number, lines: string[]) =>
    lines.map((line, index) => text([x, 170 + index * 17], line, { size: 14, weight: 700 }))
  // Symétrie axiale : axe vertical en x = 54.
  const axis = 54
  const before = flag([32, 120], [0, -1], [-1, 0])
  const after = before.map(([x, y]) => [2 * axis - x, y] as Point)
  // Symétrie centrale de centre O.
  const O: Point = [160, 92]
  const centralBefore = flag([136, 134], [0, -1], [1, 0], 1.2)
  const centralAfter = centralBefore.map(([x, y]) => [2 * O[0] - x, 2 * O[1] - y] as Point)
  // Translation : le vecteur part du coin du drapeau.
  const shift: Point = [40, -30]
  const translatedBefore = flag([238, 128], [0, -1], [1, 0])
  const translatedAfter = translatedBefore.map((point) => add(point, shift))
  return drawing(
    204,
    dashed([axis, 50], [axis, 140], { color: ACCENT, width: 1.75 }),
    text([axis, 38], '(d)', { weight: 700, color: ACCENT }),
    original(before),
    image(after),
    dashed(centralBefore[0]!, centralAfter[0]!, { width: 1.5 }),
    original(centralBefore),
    image(centralAfter),
    dot(O, { color: ACCENT }),
    text(add(O, [-10, -6]), 'O', { weight: 700, color: ACCENT, anchor: 'end' }),
    original(translatedBefore),
    image(translatedAfter),
    arrow(translatedBefore[0]!, translatedAfter[0]!, { color: ACCENT, width: 1.75, head: 8 }),
    ...caption(axis, ['symétrie', 'axiale']),
    ...caption(160, ['symétrie', 'centrale']),
    ...caption(262, ['translation']),
  )
}

const isometries = defineFigure('transformations-symetries-translation', vignettesIsometries())

/** Rotation et homothétie, côte à côte. */
function vignettesRotationHomothetie(): Drawing {
  // Rotation de centre O, d'un quart de tour dans le sens inverse des aiguilles d'une montre.
  const O: Point = [80, 110]
  const turn = (point: Point): Point => {
    const [dx, dy] = sub(point, O)
    return [O[0] + dy, O[1] - dx]
  }
  const before = flag([112, 116], [0, -1], [1, 0])
  const after = before.map(turn)
  // Homothétie de centre H et de rapport 2.
  const H: Point = [182, 140]
  const small = flag([208, 128], [0, -1], [1, 0], 0.9)
  const large = small.map((point) => add(H, scale(sub(point, H), 2)))
  return drawing(
    214,
    dashed(O, before[0]!, { width: 1.5 }),
    dashed(O, after[0]!, { width: 1.5 }),
    original(before),
    image(after),
    curvedArrow(polar(O, 52, -6), polar(O, 52, 84), 10, { color: ACCENT, width: 1.75 }),
    dot(O, { color: ACCENT }),
    text(add(O, [-10, 8]), 'O', { weight: 700, color: ACCENT, anchor: 'end' }),
    ...large.map((point) => dashed(H, point, { width: 1.5 })),
    image(large),
    original(small),
    dot(H, { color: ACCENT }),
    text(add(H, [-10, 8]), 'O', { weight: 700, color: ACCENT, anchor: 'end' }),
    text([80, 184], 'rotation', { size: 14, weight: 700 }),
    text([236, 184], 'homothétie', { size: 14, weight: 700 }),
    text([236, 201], 'de rapport 2', { size: 14, weight: 700 }),
  )
}

const rotationHomothetie = defineFigure(
  'transformations-rotation-homothetie',
  vignettesRotationHomothetie(),
)

/** Exemple : O milieu de [MM′] ; F et son image F′. */
function exempleSymetrieCentrale(): Drawing {
  const O: Point = [160, 96]
  const M: Point = [74, 118]
  const M2: Point = [2 * O[0] - M[0], 2 * O[1] - M[1]]
  const shape: Point[] = [M, [46, 86], [28, 128]]
  const shapeImage = shape.map(([x, y]) => [2 * O[0] - x, 2 * O[1] - y] as Point)
  return drawing(
    176,
    original(shape),
    image(shapeImage),
    segment(M, M2, { color: GREY, width: 1.5 }),
    equalTicks(M, O, 1),
    equalTicks(O, M2, 1),
    dot(M),
    dot(M2),
    dot(O, { color: ACCENT }),
    pointName(O, 'O', { angle: 100, color: ACCENT }),
    pointName(M, 'M', { angle: -80 }),
    pointName(M2, 'M′', { angle: 100 }),
    text([36, 150], 'F', { weight: 700 }),
    text([284, 42], 'F′', { weight: 700 }),
  )
}

const exempleSymetrie = defineFigure(
  'transformations-exemple-symetrie-centrale',
  exempleSymetrieCentrale(),
)

/** Question 6 : le carré ABCD de centre O, sommets dans le sens des aiguilles d'une montre. */
function carreCentre(): Drawing {
  const A: Point = [80, 40]
  const B: Point = [200, 40]
  const C: Point = [200, 160]
  const D: Point = [80, 160]
  const O = middle(A, C)
  // Le sens de rotation, à part, pour ne désigner aucun sommet.
  const icon: Point = [264, 100]
  const end = polar(icon, 22, 20)
  return drawing(
    200,
    polygon([A, B, C, D], { fill: PASTEL.lilas }),
    dashed(A, C, { width: 1.5 }),
    dashed(B, D, { width: 1.5 }),
    dot(O),
    text(add(O, [0, 18]), 'O', { weight: 700 }),
    pointName(A, 'A', { angle: 135 }),
    pointName(B, 'B', { angle: 45 }),
    pointName(C, 'C', { angle: -45 }),
    pointName(D, 'D', { angle: 225 }),
    arc(icon, 22, 30, 150, { color: ACCENT, width: 1.75 }),
    arrow(polar(icon, 22, 32), end, { color: ACCENT, width: 1.75, head: 8 }),
    text([icon[0], icon[1] + 2], '90°', { weight: 700, color: ACCENT }),
  )
}

const carre = defineFigure('transformations-q6-carre', carreCentre())

/** Question 8 : le triangle ABC et son image par l'homothétie de centre O et de rapport 4. */
function homothetieRapport4(): Drawing {
  const O: Point = [26, 128]
  const offsets: Point[] = [
    [42, -24],
    [46, 4],
    [60, -14],
  ]
  const small = offsets.map((offset) => add(O, offset))
  const large = offsets.map((offset) => add(O, scale(offset, 4)))
  return drawing(
    208,
    ...large.map((point) => dashed(O, point, { width: 1.5 })),
    polygon(large, { fill: PASTEL.peche }),
    polygon(small, { fill: PASTEL.lilas }),
    dot(O, { color: ACCENT }),
    text(add(O, [-4, 18]), 'O', { weight: 700, color: ACCENT }),
    text([58, 148], 'ABC', { weight: 700 }),
    text([230, 86], 'A′B′C′', { size: 13, weight: 700, halo: false }),
    text([160, 172], `ABC, périmètre ${cm(12)}, aire ${withUnit(6, 'cm²')}`, { size: 14 }),
    text([160, 192], 'A′B′C′, périmètre ?, aire ?', { size: 14, weight: 700, color: ACCENT }),
  )
}

const homothetie = defineFigure('transformations-q8-homothetie', homothetieRapport4())

export const trigonometrieFigures: readonly FigureDefinition[] = [
  vocabulaire,
  vocabulaireAutreAngle,
  arccos,
  ...longueurFigures,
  rampe,
  ...angleFigures,
  rectangle,
  toitGarage,
  aire,
  isometries,
  rotationHomothetie,
  exempleAgrandissement,
  exempleSymetrie,
  semblables,
  bouteille,
  carre,
  homothetie,
]
