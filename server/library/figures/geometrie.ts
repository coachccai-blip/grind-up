import { polygonFigure, UNKNOWN } from './families.js'
import {
  ACCENT,
  add,
  angleOf,
  centroid,
  circle,
  defineFigure,
  dimension,
  drawing,
  type Drawing,
  type FigureDefinition,
  GREY,
  group,
  INK,
  lengthLabel,
  lerp,
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
  unit,
  withParts,
  withUnit,
} from './svg.js'

/**
 * Illustrations du thème « Géométrie plane ». Une figure par entrée, construite avec les
 * familles de families.ts ou les primitives de svg.ts : voir docs/bibliotheque.md,
 * « Illustrer un exercice ».
 */

const cm = (value: number) => withUnit(value, 'cm')
const colorOf = (label: string) => (label === UNKNOWN ? ACCENT : INK)
const weightOf = (label: string) => (label === UNKNOWN ? 700 : 600)

/** Mention en haut à gauche : « Schéma à main levée », « (MN) // (BC) ». */
const note = (content: string, at: Point = [8, 14], anchor: 'start' | 'end' = 'start') =>
  text(at, content, { size: 13, color: GREY, anchor })

const HAND_DRAWN = 'Schéma à main levée'

/** Un texte tourné de `degrees` (sens des maths) autour de son point d'ancrage. */
const turnedText = (at: Point, content: string, degrees: number, color = INK, size = 15) =>
  group([text(at, content, { weight: size > 13 ? 700 : 600, color, size })], {
    transform: `rotate(${Math.round(-degrees * 10) / 10} ${at[0]} ${at[1]})`,
  })

// ---------------------------------------------------------------------------
// Théorème de Pythagore

interface RightTriangle {
  /** Le sommet de l'angle droit, celui du haut et celui de l'autre bout du côté horizontal. */
  names: readonly [right: string, up: string, across: string]
  /** Longueurs dessinées des deux côtés de l'angle droit, en unités de dessin. */
  size: readonly [up: number, across: number]
  /** Étiquettes : côté vertical, côté horizontal, hypoténuse. */
  labels: readonly [up?: string, across?: string, hypotenuse?: string]
  /** L'angle droit en bas à droite plutôt qu'en bas à gauche. */
  mirror?: boolean
}

/** Triangle rectangle étiqueté, l'angle droit en bas. */
function rightTriangle({ names, size, labels, mirror = false }: RightTriangle): Drawing {
  const [right, up, across] = names
  const [h, w] = size
  const top = 26
  const left = (320 - w) / 2
  const corner: Point = mirror ? [left + w, top + h] : [left, top + h]
  const upAt: Point = [corner[0], top]
  const acrossAt: Point = [mirror ? left : left + w, top + h]
  const sides: { from: string; to: string; label: string }[] = []
  if (labels[0]) sides.push({ from: right, to: up, label: labels[0] })
  if (labels[1]) sides.push({ from: right, to: across, label: labels[1] })
  if (labels[2]) sides.push({ from: up, to: across, label: labels[2] })
  return polygonFigure({
    height: top + h + 34,
    vertices: [
      { name: up, at: upAt },
      { name: right, at: corner },
      { name: across, at: acrossAt },
    ],
    rightAngles: [right],
    sides,
  })
}

/** Le rappel : l'hypoténuse, en face de l'angle droit, et l'égalité de Pythagore. */
function pythagoreRappel(): Drawing {
  const A: Point = [70, 176]
  const B: Point = [70, 36]
  const C: Point = [262, 176]
  const center = centroid([A, B, C])
  const mid = middle(B, C)
  const out = scale(unit(sub(mid, center)), 19)
  return drawing(
    246,
    polygon([A, B, C], { fill: PASTEL.lilas }),
    segment(B, C, { color: ACCENT, width: 3.5 }),
    rightAngle(A, B, C),
    turnedText(add(mid, out), 'hypoténuse', angleOf(B, C), ACCENT),
    turnedText([A[0] - 14, (A[1] + B[1]) / 2], 'côté de l’angle droit', 90, GREY, 13),
    text([(A[0] + C[0]) / 2, A[1] + 16], 'côté de l’angle droit', { size: 13, color: GREY }),
    pointName(A, 'A', { awayFrom: center }),
    pointName(B, 'B', { awayFrom: center }),
    pointName(C, 'C', { awayFrom: center }),
    text([160, 226], 'BC² = AB² + AC²', { size: 17, weight: 700 }),
  )
}

/** Les carrés construits sur les trois côtés : le grand vaut les deux petits réunis. */
function pythagoreCarres(): Drawing {
  const A: Point = [118, 150]
  const B: Point = [118, 90]
  const C: Point = [198, 150]
  // Carré sur [AB], à gauche ; sur [AC], en bas ; sur [BC], vers l'extérieur.
  const ab = [A, B, add(B, [-60, 0]), add(A, [-60, 0])]
  const ac = [A, C, add(C, [0, 80]), add(A, [0, 80])]
  const outward: Point = [60, -80]
  const bc = [B, C, add(C, outward), add(B, outward)]
  const label = (points: readonly Point[], content: string, color = INK) =>
    text(centroid(points), content, { size: 17, weight: 700, color, halo: false })
  return drawing(
    238,
    polygon(ab, { fill: PASTEL.peche }),
    polygon(ac, { fill: PASTEL.menthe }),
    polygon(bc, { fill: PASTEL.ciel, color: ACCENT }),
    polygon([A, B, C], { fill: PASTEL.lilas }),
    rightAngle(A, B, C),
    label(ab, 'AB²'),
    label(ac, 'AC²'),
    label(bc, 'BC²', ACCENT),
    text([136, 134], 'A', { weight: 700, halo: false }),
    pointName(B, 'B', { angle: 120 }),
    pointName(C, 'C', { angle: -20 }),
  )
}

/** L'échelle contre le mur : le mur, le sol, l'échelle et la hauteur cherchée. */
function pythagoreEchelle(): Drawing {
  const ground = 206
  const wall = 214
  const foot: Point = [104, ground]
  const touch: Point = [wall, 46]
  const along = unit(sub(touch, foot))
  const normal: Point = [-along[1], along[0]]
  const rail = (shift: number) => [
    add(foot, scale(normal, shift)),
    add(touch, scale(normal, shift)),
  ]
  const [a1, b1] = rail(0)
  const [a2, b2] = rail(-9)
  const rungs: Part[] = []
  for (let t = 0.12; t < 0.95; t += 0.11) {
    rungs.push(segment(lerp(a1!, b1!, t), lerp(a2!, b2!, t), { color: GREY, width: 2 }))
  }
  const bricks: Part[] = []
  for (let y = 40; y < ground; y += 18)
    bricks.push(segment([wall, y], [wall + 34, y], { color: GREY, width: 1 }))
  return drawing(
    252,
    rect([wall, 22], 34, ground - 22, { fill: PASTEL.peche, width: 0 }),
    ...bricks,
    segment([wall, 22], [wall, ground]),
    segment([24, ground], [300, ground]),
    ...rungs,
    segment(a1!, b1!, { width: 2.5 }),
    segment(a2!, b2!, { width: 2.5 }),
    rightAngle([wall, ground], [wall, 30], [40, ground]),
    text(add(middle(foot, touch), scale(normal, -34)), withUnit(5, 'm'), { weight: 700 }),
    dimension([wall + 34, ground], [wall + 34, touch[1]], UNKNOWN, {
      outside: [0, 120],
      offset: 22,
      labelColor: ACCENT,
    }),
    dimension(foot, [wall, ground], withUnit(1.4, 'm'), { outside: [170, 0], offset: 24 }),
    text([wall + 17, 14], 'mur', { size: 13, color: GREY }),
  )
}

/** Un triangle dont on ne sait pas s'il est rectangle : le même gabarit pour les deux questions. */
function triangleQuelconque(sides: readonly [short: string, middle: string, long: string]) {
  const P: Point = [36, 186]
  const Q: Point = [286, 186]
  const R: Point = [118, 52]
  const center = centroid([P, Q, R])
  const label = (a: Point, b: Point, content: string) =>
    lengthLabel(a, b, content, { outside: center, weight: 600 })
  return drawing(
    222,
    polygon([P, Q, R], { fill: PASTEL.lilas }),
    label(P, R, sides[0]),
    label(R, Q, sides[1]),
    label(P, Q, sides[2]),
    note(HAND_DRAWN, [312, 18], 'end'),
  )
}

const pythagoreFigures = [
  defineFigure('pythagore-rappel-hypotenuse', pythagoreRappel()),
  defineFigure('pythagore-rappel-carres', pythagoreCarres()),
  defineFigure(
    'pythagore-exemple-efg',
    rightTriangle({ names: ['E', 'F', 'G'], size: [104, 196], labels: [cm(8), cm(15), UNKNOWN] }),
  ),
  defineFigure(
    'pythagore-exemple-rst',
    rightTriangle({
      names: ['R', 'S', 'T'],
      size: [130, 172],
      labels: [cm(12), UNKNOWN, cm(20)],
      mirror: true,
    }),
  ),
  defineFigure(
    'pythagore-q1-abc',
    rightTriangle({ names: ['A', 'B', 'C'], size: [126, 180], labels: [cm(3), cm(4), UNKNOWN] }),
  ),
  defineFigure(
    'pythagore-q2-def',
    rightTriangle({
      names: ['D', 'E', 'F'],
      size: [96, 210],
      labels: [cm(5), cm(12), UNKNOWN],
      mirror: true,
    }),
  ),
  defineFigure(
    'pythagore-q3-ijk',
    rightTriangle({ names: ['I', 'J', 'K'], size: [124, 176], labels: [cm(6), UNKNOWN, cm(10)] }),
  ),
  defineFigure(
    'pythagore-q4-lmn',
    rightTriangle({
      names: ['M', 'L', 'N'],
      size: [130, 190],
      labels: [cm(4), cm(6), UNKNOWN],
      mirror: true,
    }),
  ),
  defineFigure('pythagore-q5-echelle', pythagoreEchelle()),
  defineFigure('pythagore-q6-triangle', triangleQuelconque([cm(9), cm(12), cm(15)])),
  defineFigure('pythagore-q7-triangle', triangleQuelconque([cm(7), cm(9), cm(11)])),
]

// ---------------------------------------------------------------------------
// Configurations de Thalès

/** Les cinq lettres, dans les rôles A (le sommet commun), M, B (première droite), N, C. */
type Names = readonly [a: string, m: string, b: string, n: string, c: string]

/** Les longueurs à écrire ; les longueurs entières AB et AC des triangles emboîtés s'écrivent sur une cote. */
interface Labels {
  am?: string
  mb?: string
  ab?: string
  an?: string
  nc?: string
  ac?: string
  mn?: string
  bc?: string
}

interface Configuration {
  names: Names
  labels?: Labels
  /** Mention en haut à gauche. */
  caption?: string
  /** Les deux triangles coloriés, (MN) et (BC) en couleur : la figure du rappel. */
  highlight?: boolean
}

interface Placed {
  A: Point
  M: Point
  B: Point
  N: Point
  C: Point
}

/** Ce que les deux configurations ont en commun : les tracés, les longueurs et les noms. */
function configuration(
  { A, M, B, N, C }: Placed,
  { names, labels = {}, caption, highlight = false }: Configuration,
  options: { nested: boolean; height: number },
): Drawing {
  const big = centroid([A, B, C])
  const small = centroid([A, M, N])
  const parallel = highlight ? { color: ACCENT, width: 3 } : {}
  const parts: Part[] = [
    highlight && polygon([A, B, C], { fill: PASTEL.lilas, width: 0 }),
    highlight && polygon([A, M, N], { fill: PASTEL.peche, width: 0 }),
    options.nested ? segment(A, B) : segment(M, B),
    options.nested ? segment(A, C) : segment(N, C),
    segment(B, C, parallel),
    segment(M, N, parallel),
  ]
  const part = (a: Point, b: Point, content: string | undefined, inside: Point) =>
    content &&
    lengthLabel(a, b, content, {
      outside: inside,
      color: colorOf(content),
      weight: weightOf(content),
    })
  const whole = (a: Point, b: Point, content: string | undefined) =>
    content &&
    dimension(a, b, content, {
      outside: big,
      offset: 40,
      labelColor: colorOf(content),
    })
  if (options.nested) {
    parts.push(
      part(A, M, labels.am, big),
      part(M, B, labels.mb, big),
      part(A, N, labels.an, big),
      part(N, C, labels.nc, big),
      whole(A, B, labels.ab),
      whole(A, C, labels.ac),
    )
  } else {
    parts.push(
      part(A, M, labels.am, small),
      part(A, B, labels.ab, big),
      part(A, N, labels.an, small),
      part(A, C, labels.ac, big),
    )
  }
  // [MN] s'étiquette du côté de A, [BC] de l'autre côté.
  const mn = middle(M, N)
  parts.push(
    part(M, N, labels.mn, options.nested ? middle(B, C) : add(mn, sub(mn, A))),
    part(B, C, labels.bc, A),
  )
  const [a, m, b, n, c] = names
  parts.push(
    options.nested ? pointName(A, a, { awayFrom: big }) : pointName(A, a, { angle: -90 }),
    pointName(M, m, { awayFrom: N, marked: true }),
    pointName(N, n, { awayFrom: M, marked: true }),
    pointName(B, b, { awayFrom: options.nested ? big : C }),
    pointName(C, c, { awayFrom: options.nested ? big : B }),
    caption && note(caption),
  )
  return drawing(options.height, ...parts)
}

/** Triangles emboîtés : A à gauche, M sur [AB], N sur [AC] ; `t` place M et N. */
function nested(
  config: Configuration & { tM: number; tN?: number; corners?: readonly [Point, Point, Point] },
) {
  const [A, B, C] = config.corners ?? [
    [24, 132],
    [250, 56],
    [250, 214],
  ]
  return configuration(
    { A, B, C, M: lerp(A, B, config.tM), N: lerp(A, C, config.tN ?? config.tM) },
    config,
    { nested: true, height: 252 },
  )
}

/** Papillon : A au milieu, B et C à droite, M et N de l'autre côté de A ; `k` vaut AM/AB. */
function butterfly(
  config: Configuration & { kM: number; kN?: number; corners?: readonly [Point, Point, Point] },
) {
  const [A, B, C] = config.corners ?? [
    [132, 124],
    [282, 40],
    [282, 210],
  ]
  const M = add(A, scale(sub(A, B), config.kM))
  const N = add(A, scale(sub(A, C), config.kN ?? config.kM))
  return configuration({ A, B, C, M, N }, config, { nested: false, height: 236 })
}

/** L'arbre, le bâton et leurs ombres, qui se terminent en A. */
function thalesArbre(): Drawing {
  const ground = 200
  const A: Point = [26, ground]
  const M: Point = [84, ground]
  const B: Point = [252, ground]
  const N: Point = [84, ground - 42]
  const C = add(A, scale(sub(N, A), (B[0] - A[0]) / (N[0] - A[0])))
  const sun = add(C, scale(unit(sub(C, A)), 46))
  const rays: Part[] = [0, 45, 90, 135, 180, 225, 270, 315].map((degrees) =>
    segment(polar(sun, 15, degrees), polar(sun, 21, degrees), { color: GREY, width: 1.5 }),
  )
  return drawing(
    252,
    circle(sun, 11, { fill: PASTEL.citron, color: GREY, width: 1.5 }),
    ...rays,
    path(
      `M ${B[0]} ${C[1] + 70} C ${B[0] - 52} ${C[1] + 74} ${B[0] - 44} ${C[1] - 4} ${B[0]} ${C[1]} C ${B[0] + 44} ${C[1] - 4} ${B[0] + 52} ${C[1] + 74} ${B[0]} ${C[1] + 70} Z`,
      { fill: PASTEL.anis, color: GREY, width: 1.5 },
    ),
    segment(A, C, { color: GREY, width: 1.5, dashed: true }),
    segment([12, ground], [308, ground]),
    segment(B, C, { width: 3 }),
    segment(M, N, { width: 3 }),
    lengthLabel(M, N, withUnit(1.5, 'm'), { outside: [0, N[1]] }),
    lengthLabel(B, C, UNKNOWN, { outside: [0, C[1]], color: ACCENT, weight: 700, distance: 8 }),
    dimension(A, M, withUnit(2, 'm'), { outside: [0, 0], offset: 34 }),
    dimension(M, B, withUnit(10, 'm'), { outside: [0, 0], offset: 34 }),
    pointName(A, 'A', { angle: -100 }),
    pointName(M, 'M', { angle: -90 }),
    pointName(B, 'B', { angle: -90 }),
    pointName(N, 'N', { angle: 100 }),
    pointName(C, 'C', { angle: 40 }),
  )
}

const thalesFigures = [
  defineFigure(
    'thales-rappel-emboites',
    nested({ names: ['A', 'M', 'B', 'N', 'C'], tM: 0.5, caption: '(MN) // (BC)', highlight: true }),
  ),
  defineFigure(
    'thales-rappel-papillon',
    butterfly({
      names: ['A', 'M', 'B', 'N', 'C'],
      kM: 0.6,
      caption: '(MN) // (BC)',
      highlight: true,
    }),
  ),
  defineFigure(
    'thales-exemple-emboites',
    nested({
      names: ['A', 'M', 'B', 'N', 'C'],
      tM: 0.75,
      labels: { am: cm(6), mb: cm(2), mn: UNKNOWN, bc: cm(12) },
      caption: '(MN) // (BC)',
    }),
  ),
  defineFigure(
    'thales-exemple-papillon',
    butterfly({
      names: ['K', 'E', 'G', 'F', 'H'],
      kM: 0.4,
      labels: { am: cm(3), ab: cm(7.5), an: cm(2), ac: UNKNOWN },
      caption: '(EF) // (GH)',
    }),
  ),
  defineFigure(
    'thales-q1-abc',
    nested({
      names: ['A', 'M', 'B', 'N', 'C'],
      tM: 1 / 3,
      labels: { am: cm(2), ab: cm(6), an: UNKNOWN, ac: cm(9) },
      caption: '(MN) // (BC)',
    }),
  ),
  defineFigure(
    'thales-q2-rst',
    nested({
      names: ['R', 'U', 'S', 'V', 'T'],
      tM: 0.4,
      labels: { am: cm(4), ab: cm(10), mn: cm(3), bc: UNKNOWN },
      caption: '(UV) // (ST)',
    }),
  ),
  defineFigure(
    'thales-q3-abc',
    nested({
      names: ['A', 'M', 'B', 'N', 'C'],
      tM: 0.625,
      labels: { am: cm(5), mb: cm(3), mn: cm(4), bc: UNKNOWN },
      caption: '(MN) // (BC)',
    }),
  ),
  defineFigure(
    'thales-q4-papillon',
    butterfly({
      names: ['A', 'M', 'B', 'N', 'C'],
      kM: 0.4,
      labels: { am: cm(2.4), ab: cm(6), an: cm(3.2), ac: UNKNOWN },
      caption: '(MN) // (BC)',
    }),
  ),
  defineFigure(
    'thales-q5-papillon',
    butterfly({
      names: ['G', 'E', 'K', 'F', 'L'],
      kM: 0.6,
      labels: { am: cm(3), ab: cm(5), mn: cm(7), bc: UNKNOWN },
      caption: '(EF) // (KL)',
    }),
  ),
  defineFigure('thales-q6-arbre', thalesArbre()),
]

// ---------------------------------------------------------------------------
// Réciproque du théorème de Thalès

/**
 * Les schémas à main levée des questions : un seul gabarit par configuration, pour toutes
 * les questions, que les droites soient parallèles ou non. Ni à l'échelle, ni codés.
 */
const nestedSketch = (names: Names, labels: Labels) =>
  nested({
    names,
    labels,
    tM: 0.42,
    tN: 0.48,
    corners: [
      [24, 138],
      [254, 52],
      [238, 214],
    ],
    caption: HAND_DRAWN,
  })

const butterflySketch = (names: Names, labels: Labels) =>
  butterfly({
    names,
    labels,
    kM: 0.56,
    kN: 0.62,
    corners: [
      [134, 128],
      [286, 52],
      [270, 212],
    ],
    caption: HAND_DRAWN,
  })

/** Le rappel : deux configurations où les points sont alignés dans le même ordre. */
function memeOrdre(): Drawing {
  const left = nested({
    names: ['A', 'M', 'B', 'N', 'C'],
    tM: 0.5,
    corners: [
      [16, 92],
      [134, 34],
      [134, 160],
    ],
  })
  const right = butterfly({
    names: ['A', 'M', 'B', 'N', 'C'],
    kM: 0.6,
    corners: [
      [228, 96],
      [300, 44],
      [300, 156],
    ],
  })
  return drawing(
    226,
    ...left.parts,
    ...right.parts,
    text([80, 196], 'M sur [AB]', { size: 13, color: GREY }),
    text([80, 214], 'N sur [AC]', { size: 13, color: GREY }),
    text([246, 196], 'A entre M et B', { size: 13, color: GREY }),
    text([246, 214], 'A entre N et C', { size: 13, color: GREY }),
  )
}

/**
 * M est sur [AB], mais N est de l'autre côté de A. Les longueurs, s'il y en a, s'écrivent
 * en légende sous la figure : une cote de [AB] couperait les autres tracés.
 */
function ordreDifferent(legend?: readonly [string, string, string, string]): Drawing {
  const dy = legend ? -26 : 0
  const A: Point = [148, 132 + dy]
  const B: Point = [290, 58 + dy]
  const C: Point = [284, 214 + dy]
  const M = lerp(A, B, 0.72)
  const N = add(A, scale(sub(A, C), 0.66))
  const center = centroid([A, B, C])
  const line = (at: Point, content: string, anchor: 'start' | 'end') =>
    text(at, content, { size: 14, weight: 700, anchor })
  return drawing(
    legend ? 250 : 236,
    segment(A, B),
    segment(N, C),
    segment(B, C),
    segment(M, N),
    pointName(A, 'A', { angle: -120 }),
    pointName(M, 'M', { awayFrom: C, marked: true }),
    pointName(N, 'N', { angle: 150, marked: true }),
    pointName(B, 'B', { awayFrom: center }),
    pointName(C, 'C', legend ? { angle: 0 } : { awayFrom: center }),
    ...(legend
      ? [
          line([14, 212], legend[0], 'start'),
          line([14, 234], legend[1], 'start'),
          line([306, 212], legend[2], 'end'),
          line([306, 234], legend[3], 'end'),
          note(HAND_DRAWN),
        ]
      : []),
  )
}

/** L'escabeau vu de profil : ses deux montants, le sol et la tablette [MN]. */
function escabeau(): Drawing {
  const ground = 214
  const A: Point = [158, 34]
  const B: Point = [96, ground]
  const C: Point = [230, ground]
  const M = lerp(A, B, 0.62)
  const N = lerp(A, C, 0.635)
  const leg = (from: Point, to: Point) => {
    const u = unit(sub(to, from))
    const n = scale([-u[1], u[0]], 4)
    return polygon([add(from, n), add(to, n), sub(to, n), sub(from, n)], {
      fill: PASTEL.citron,
      width: 1.5,
    })
  }
  const legend = (at: Point, content: string, anchor: 'start' | 'end') =>
    text(at, content, { size: 14, weight: 700, anchor })
  return drawing(
    242,
    segment([14, ground], [306, ground], { color: GREY }),
    leg(A, B),
    leg(A, C),
    leg(M, N),
    pointName(A, 'A', { angle: 90 }),
    pointName(M, 'M', { angle: 180 }),
    pointName(N, 'N', { angle: 0 }),
    pointName(B, 'B', { angle: -120 }),
    pointName(C, 'C', { angle: -60 }),
    legend([10, 96], `AM = ${cm(60)}`, 'start'),
    legend([10, 120], `AB = ${cm(90)}`, 'start'),
    legend([312, 96], `AN = ${cm(67)}`, 'end'),
    legend([312, 120], `AC = ${cm(100)}`, 'end'),
    text([160, 232], 'sol', { size: 13, color: GREY }),
    note(HAND_DRAWN),
  )
}

const reciproqueFigures = [
  defineFigure('reciproque-thales-rappel-meme-ordre', memeOrdre()),
  defineFigure(
    'reciproque-thales-rappel-ordre-different',
    withParts(ordreDifferent(), note('N n’est pas du même côté de A que C')),
  ),
  defineFigure(
    'reciproque-thales-exemple-emboites',
    nestedSketch(['A', 'M', 'B', 'N', 'C'], { am: cm(3), ab: cm(12), an: cm(2), ac: cm(8) }),
  ),
  defineFigure(
    'reciproque-thales-exemple-papillon',
    butterflySketch(['K', 'E', 'G', 'F', 'H'], { am: cm(4), ab: cm(9), an: cm(3), ac: cm(7) }),
  ),
  defineFigure(
    'reciproque-thales-q1-abc',
    nestedSketch(['A', 'M', 'B', 'N', 'C'], { am: cm(2), ab: cm(5), an: cm(3), ac: cm(7.5) }),
  ),
  defineFigure(
    'reciproque-thales-q2-rst',
    nestedSketch(['R', 'U', 'S', 'V', 'T'], { am: cm(3), ab: cm(5), an: cm(6), ac: cm(8) }),
  ),
  defineFigure(
    'reciproque-thales-q3-papillon',
    butterflySketch(['A', 'M', 'B', 'N', 'C'], { am: cm(4), ab: cm(6), an: cm(6), ac: cm(9) }),
  ),
  defineFigure(
    'reciproque-thales-q4-efg',
    nestedSketch(['E', 'K', 'F', 'L', 'G'], { am: cm(4), mb: cm(6), an: cm(6), ac: cm(15) }),
  ),
  defineFigure('reciproque-thales-q5-escabeau', escabeau()),
  defineFigure(
    'reciproque-thales-q6-ordre',
    ordreDifferent([`AM = ${cm(3)}`, `AB = ${cm(4)}`, `AN = ${cm(4.5)}`, `AC = ${cm(6)}`]),
  ),
]

export const geometrieFigures: readonly FigureDefinition[] = [
  ...pythagoreFigures,
  ...thalesFigures,
  ...reciproqueFigures,
]
