import { UNKNOWN } from './families.js'
import {
  ACCENT,
  add,
  arrow,
  circle,
  dashed,
  defineFigure,
  dot,
  drawing,
  type Drawing,
  ellipse,
  type FigureDefinition,
  GREY,
  INK,
  lengthLabel,
  type Part,
  PASTEL,
  path,
  type Point,
  pointName,
  polygon,
  polyline,
  rightAngle,
  scale,
  segment,
  sub,
  text,
  WHITE,
  withUnit,
} from './svg.js'

/**
 * Illustrations du thème « Espace et grandeurs ». Une figure par entrée, construite avec les
 * familles de families.ts ou les primitives de svg.ts : voir docs/bibliotheque.md,
 * « Illustrer un exercice ».
 *
 * Les solides sont dessinés en perspective cavalière simple : une base circulaire est une
 * ellipse, dont la moitié arrière, cachée, est en pointillés. Quand une question demande
 * « quelle est la section ? », le plan de coupe est dessiné derrière le solide, qui reste
 * entier : la figure montre la position du plan, jamais le contour de la section.
 */

const r1 = (value: number) => Math.round(value * 10) / 10
const at = (point: Point) => `${r1(point[0])} ${r1(point[1])}`
const cm = (value: number) => withUnit(value, 'cm')

/** Ce qu'on cherche, écrit en bleu : « V = ? ». */
const asked = (where: Point, content: string, anchor: 'start' | 'middle' | 'end' = 'start') =>
  text(where, content, { color: ACCENT, weight: 700, anchor })

/** Petite légende grise. */
const note = (where: Point, content: string, anchor: 'start' | 'middle' | 'end' = 'middle') =>
  text(where, content, { size: 13, color: GREY, anchor })

/** Demi-ellipse horizontale : celle de devant (visible) ou celle de derrière. */
function halfEllipse(center: Point, rx: number, ry: number, front: boolean, dashedLine: boolean) {
  const left: Point = [center[0] - rx, center[1]]
  const right: Point = [center[0] + rx, center[1]]
  return path(`M ${at(left)} A ${r1(rx)} ${r1(ry)} 0 0 ${front ? 0 : 1} ${at(right)}`, {
    color: dashedLine ? GREY : INK,
    width: dashedLine ? 1.5 : 2,
    dashed: dashedLine,
  })
}

/** Cote verticale, avec ses traits de rappel en pointillés et sa longueur à côté. */
function verticalDimension(
  x: number,
  top: number,
  bottom: number,
  label: string,
  { side = 'right', from }: { side?: 'left' | 'right'; from?: readonly [number, number] } = {},
): Part {
  const parts: Part[] = [
    arrow([x, top], [x, bottom], { both: true, color: GREY, width: 1.5, head: 7 }),
  ]
  if (from) {
    parts.push(
      dashed([from[0], top], [x, top], { width: 1 }),
      dashed([from[1], bottom], [x, bottom], { width: 1 }),
    )
  }
  const dx = side === 'right' ? 7 : -7
  parts.push(
    text([x + dx, (top + bottom) / 2], label, {
      color: label === UNKNOWN ? ACCENT : INK,
      weight: label === UNKNOWN ? 700 : 600,
      anchor: side === 'right' ? 'start' : 'end',
    }),
  )
  return parts.join('')
}

// ---------------------------------------------------------------------------
// Solides

interface Round {
  /** Centre de la base. */
  center: Point
  rx: number
  ry: number
}

/** Cône pointe en haut : sa base, son sommet et sa surface. */
function coneUp({ center, rx, ry }: Round, height: number, fill: string = PASTEL.lilas): Part[] {
  const apex: Point = [center[0], center[1] - height]
  const left: Point = [center[0] - rx, center[1]]
  const right: Point = [center[0] + rx, center[1]]
  return [
    path(`M ${at(apex)} L ${at(left)} A ${r1(rx)} ${r1(ry)} 0 0 0 ${at(right)} Z`, {
      fill,
      width: 0,
    }),
    halfEllipse(center, rx, ry, false, true),
    halfEllipse(center, rx, ry, true, false),
    segment(apex, left),
    segment(apex, right),
  ]
}

/** Cylindre : base du bas (moitié arrière cachée), côtés, base du haut entière. */
function cylinder({ center, rx, ry }: Round, height: number, fill: string = PASTEL.lilas): Part[] {
  const top: Point = [center[0], center[1] - height]
  const bl: Point = [center[0] - rx, center[1]]
  const br: Point = [center[0] + rx, center[1]]
  const tl: Point = [top[0] - rx, top[1]]
  const tr: Point = [top[0] + rx, top[1]]
  return [
    path(
      `M ${at(tl)} L ${at(bl)} A ${r1(rx)} ${r1(ry)} 0 0 0 ${at(br)} L ${at(tr)} A ${r1(rx)} ${r1(ry)} 0 0 0 ${at(tl)} Z`,
      { fill, width: 0 },
    ),
    halfEllipse(center, rx, ry, false, true),
    halfEllipse(center, rx, ry, true, false),
    segment(tl, bl),
    segment(tr, br),
    ellipse(top, rx, ry, { fill: WHITE }),
  ]
}

/** Boule : le disque de contour et l'équateur en perspective. */
function ball(center: Point, radius: number, fill: string = PASTEL.lilas): Part[] {
  const ry = radius * 0.27
  return [
    circle(center, radius, { fill }),
    halfEllipse(center, radius, ry, false, true),
    halfEllipse(center, radius, ry, true, false),
  ]
}

interface SquarePyramid {
  /** Les sommets de la base, dans l'ordre : avant gauche, avant droit, arrière droit, arrière gauche. */
  base: readonly [Point, Point, Point, Point]
  apex: Point
  center: Point
}

/** Pyramide à base carrée, de centre de base `center`. */
function squarePyramid(center: Point, half: number, depth: Point, height: number): SquarePyramid {
  const h = scale(depth, 0.5)
  return {
    base: [
      sub(sub(center, [half, 0]), h),
      sub(add(center, [half, 0]), h),
      add(add(center, [half, 0]), h),
      add(sub(center, [half, 0]), h),
    ],
    apex: [center[0], center[1] - height],
    center,
  }
}

function drawPyramid({ base, apex }: SquarePyramid, fill: string = PASTEL.lilas): Part[] {
  const [a, b, c, d] = base
  return [
    polygon([apex, a, b], { fill, width: 0 }),
    polygon([apex, b, c], { fill: PASTEL.ciel, width: 0 }),
    dashed(a, d, { width: 1.5 }),
    dashed(d, c, { width: 1.5 }),
    dashed(apex, d, { width: 1.5 }),
    segment(a, b),
    segment(b, c),
    segment(apex, a),
    segment(apex, b),
    segment(apex, c),
  ]
}

interface Box {
  /** Les huit sommets, A B C D en bas, E F G H au-dessus. */
  points: Record<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H', Point>
}

/**
 * Pavé droit ABCDEFGH : A à l'avant à gauche, B à l'avant à droite, D derrière A (la
 * profondeur part vers le haut à gauche), E, F, G, H au-dessus de A, B, C, D.
 */
function box(a: Point, width: number, depth: Point, height: number): Box {
  const b = add(a, [width, 0])
  const d = add(a, depth)
  const c = add(b, depth)
  const up: Point = [0, -height]
  return {
    points: { A: a, B: b, C: c, D: d, E: add(a, up), F: add(b, up), G: add(c, up), H: add(d, up) },
  }
}

function drawBox({ points: p }: Box, names = true, faces = true): Part[] {
  const center: Point = [(p.A[0] + p.G[0]) / 2, (p.A[1] + p.G[1]) / 2]
  return [
    faces && polygon([p.A, p.B, p.F, p.E], { fill: PASTEL.lilas, width: 0 }),
    faces && polygon([p.A, p.E, p.H, p.D], { fill: PASTEL.ciel, width: 0 }),
    faces && polygon([p.E, p.F, p.G, p.H], { fill: PASTEL.menthe, width: 0 }),
    dashed(p.D, p.C, { width: 1.5 }),
    dashed(p.C, p.B, { width: 1.5 }),
    dashed(p.C, p.G, { width: 1.5 }),
    polygon([p.A, p.B, p.F, p.E]),
    polyline([p.A, p.D, p.H, p.G, p.F]),
    segment(p.E, p.H),
    ...(names
      ? (Object.entries(p) as [string, Point][]).map(([name, point]) =>
          // E, en haut à l'avant, s'écrirait sur l'arête [EH] : on l'écrit à sa gauche.
          pointName(point, name, name === 'E' ? { angle: 195 } : { awayFrom: center }),
        )
      : []),
  ]
}

/** Plan de coupe horizontal, dessiné en parallélogramme. */
function horizontalPlane(corners: readonly [Point, Point, Point, Point]) {
  return polygon(corners, { fill: PASTEL.citron, color: GREY, width: 1.5 })
}

// ---------------------------------------------------------------------------
// Volumes : rappel

/** Le solide pointu occupe le tiers du solide droit de même base et de même hauteur. */
function volumesTiers(): Drawing {
  // À gauche : la pyramide dans son pavé droit, dessiné en pointillés.
  const prism = box([30, 168], 92, [36, -22], 110).points
  const pyramid: SquarePyramid = {
    base: [prism.A, prism.B, prism.C, prism.D],
    apex: [(prism.E[0] + prism.G[0]) / 2, (prism.E[1] + prism.G[1]) / 2],
    center: [(prism.A[0] + prism.C[0]) / 2, (prism.A[1] + prism.C[1]) / 2],
  }
  const ghost = { width: 1.5, color: GREY }
  const left: Part[] = [
    dashed(prism.E, prism.F, ghost),
    dashed(prism.F, prism.G, ghost),
    dashed(prism.G, prism.H, ghost),
    dashed(prism.H, prism.E, ghost),
    dashed(prism.A, prism.E, ghost),
    dashed(prism.B, prism.F, ghost),
    dashed(prism.C, prism.G, ghost),
    ...drawPyramid(pyramid),
    dashed(pyramid.apex, pyramid.center, { color: ACCENT, width: 1.5 }),
    text([pyramid.apex[0] - 7, 120], 'h', { color: ACCENT, weight: 700, anchor: 'end' }),
  ]
  // À droite : le cône dans son cylindre.
  const base: Round = { center: [238, 166], rx: 54, ry: 15 }
  const top: Point = [238, 56]
  const right: Part[] = [
    dashed([base.center[0] - base.rx, 166], [base.center[0] - base.rx, 56], ghost),
    dashed([base.center[0] + base.rx, 166], [base.center[0] + base.rx, 56], ghost),
    ellipse(top, base.rx, base.ry, { color: GREY, width: 1.5, dashed: true }),
    ...coneUp(base, 110),
    dashed(top, base.center, { color: ACCENT, width: 1.5 }),
    text([top[0] + 8, 120], 'h', { color: ACCENT, weight: 700, anchor: 'start' }),
  ]
  return drawing(
    252,
    ...left,
    ...right,
    text([86, 202], 'pyramide', { weight: 700 }),
    note([86, 220], '1/3 du pavé droit'),
    text([238, 202], 'cône', { weight: 700 }),
    note([238, 220], '1/3 du cylindre'),
    text([160, 242], 'V = 1/3 × aire de la base × h', { color: ACCENT, weight: 700 }),
  )
}

/** Cylindre et boule, leurs longueurs et leurs formules. */
function volumesCylindreBoule(): Drawing {
  const base: Round = { center: [82, 150], rx: 50, ry: 14 }
  const top: Point = [82, 52]
  const center: Point = [236, 104]
  const radius = 62
  return drawing(
    214,
    ...cylinder(base, 98),
    segment(top, [top[0] + base.rx, top[1]], { color: ACCENT }),
    dot(top, { radius: 2.5 }),
    text([top[0] + 25, top[1] - 24], 'r', { color: ACCENT, weight: 700 }),
    verticalDimension(150, 52, 150, 'h', { from: [134, 134] }),
    ...ball(center, radius),
    segment(center, [center[0] + radius, center[1]], { color: ACCENT }),
    dot(center, { radius: 2.5 }),
    text([center[0] + 31, center[1] - 12], 'r', { color: ACCENT, weight: 700 }),
    note([82, 182], 'cylindre'),
    text([82, 202], 'V = π × r² × h', { color: ACCENT, weight: 700 }),
    note([236, 182], 'boule'),
    text([236, 202], 'V = 4/3 × π × r³', { color: ACCENT, weight: 700 }),
  )
}

// ---------------------------------------------------------------------------
// Volumes : exemples et questions

/** Cône pointe en haut, son rayon, sa hauteur en cote, et ce qu'on cherche. */
function coneWithSizes(radius: string, height: string, question: string): Drawing {
  const base: Round = { center: [160, 196], rx: 62, ry: 17 }
  const apex: Point = [160, 46]
  return drawing(
    224,
    ...coneUp(base, 150),
    dashed(apex, base.center, { width: 1.5 }),
    rightAngle(base.center, apex, [222, 196], { size: 9 }),
    segment(base.center, [222, 196], { color: ACCENT }),
    dot(base.center, { radius: 2.5 }),
    text([228, 212], radius, { anchor: 'start' }),
    verticalDimension(272, 46, 196, height, { from: [166, 228] }),
    pointName(apex, 'S', { angle: 100 }),
    asked([28, 60], question),
  )
}

/** Boule de centre O avec son rayon, ou sphère avec son diamètre. */
function ballWithSize(label: string, question: string, diameter = false): Drawing {
  const center: Point = [160, 120]
  const radius = 92
  const start: Point = diameter ? [center[0] - radius, center[1]] : center
  return drawing(
    226,
    ...ball(center, radius),
    segment(start, [center[0] + radius, center[1]], { color: ACCENT }),
    dot(center, { radius: 3 }),
    // Un diamètre s'étiquette en son milieu, sous le trait, et le centre au-dessus :
    // la longueur se lit alors sur tout le segment, pas sur un rayon.
    text([center[0] - 10, center[1] - 14], 'O', { weight: 700 }),
    diameter
      ? text([center[0], center[1] + 14], label)
      : text([center[0] + radius / 2, center[1] - 14], label),
    asked([14, 26], question),
  )
}

function volumesPyramide(): Drawing {
  const pyramid = squarePyramid([150, 192], 72, [52, -28], 150)
  const [a, b] = pyramid.base
  return drawing(
    232,
    ...drawPyramid(pyramid),
    dashed(pyramid.apex, pyramid.center, { width: 1.5, color: ACCENT }),
    rightAngle(pyramid.center, pyramid.apex, b, { size: 8 }),
    text([144, 142], cm(5), { anchor: 'end' }),
    lengthLabel(a, b, cm(6), { outside: pyramid.apex }),
    lengthLabel(b, pyramid.base[2], cm(6), { outside: pyramid.center, side: 'right' }),
    pointName(pyramid.apex, 'S', { angle: 90 }),
    asked([24, 54], 'V = ?'),
  )
}

/** Un récupérateur d'eau de pluie sous sa gouttière. */
function recuperateur(): Drawing {
  const base: Round = { center: [140, 206], rx: 68, ry: 18 }
  const top: Point = [140, 76]
  const drop = (x: number, y: number) =>
    path(`M ${x} ${y} Q ${x + 5} ${y + 8} ${x} ${y + 11} Q ${x - 5} ${y + 8} ${x} ${y} Z`, {
      fill: PASTEL.ciel,
      color: ACCENT,
      width: 1.5,
    })
  return drawing(
    242,
    segment([20, 226], [300, 226], { color: GREY, width: 1.5 }),
    ...cylinder(base, 130, PASTEL.menthe),
    polyline(
      [
        [300, 8],
        [300, 30],
        [196, 30],
        [196, 52],
      ],
      { color: GREY, width: 9 },
    ),
    drop(196, 58),
    segment([top[0] - base.rx, top[1]], [top[0] + base.rx, top[1]], { color: ACCENT }),
    text([140, 46], cm(80)),
    verticalDimension(52, 76, 206, withUnit(1, 'm'), { side: 'left', from: [72, 72] }),
    text([140, 150], '? L', { size: 20, color: ACCENT, weight: 700, halo: false }),
  )
}

/** Un cornet : cône pointe en bas, surmonté d'une demi-boule de glace. */
function cornet(): Drawing {
  const center: Point = [140, 108]
  const rx = 42
  const ry = 12
  const apex: Point = [140, 250]
  const left: Point = [center[0] - rx, center[1]]
  const right: Point = [center[0] + rx, center[1]]
  return drawing(
    258,
    path(`M ${at(left)} L ${at(apex)} L ${at(right)} A ${rx} ${ry} 0 0 1 ${at(left)} Z`, {
      fill: PASTEL.peche,
    }),
    path(`M ${at(left)} A ${rx} ${rx} 0 0 1 ${at(right)} A ${rx} ${ry} 0 0 1 ${at(left)} Z`, {
      fill: PASTEL.rose,
    }),
    segment(center, right, { color: ACCENT }),
    dot(center, { radius: 2.5 }),
    text([center[0] + rx / 2, center[1] - 13], cm(3)),
    verticalDimension(212, 108, 250, cm(12), { from: [182, 146] }),
    note([188, 74], 'demi-boule', 'start'),
    note([170, 186], 'cône', 'start'),
    asked([20, 40], 'V = ?'),
  )
}

// ---------------------------------------------------------------------------
// Sections : rappel

/** Trois solides coupés par un plan parallèle à la base, la section en jaune. */
function sectionsTrois(): Drawing {
  const sectionStyle = { fill: PASTEL.citron, color: ACCENT, width: 2 }
  // Pavé droit.
  const p = box([42, 150], 58, [-24, -14], 82).points
  const lift = (point: Point): Point => [point[0], point[1] - 42]
  // Cylindre.
  const cyl: Round = { center: [160, 150], rx: 36, ry: 10 }
  // Cône.
  const cone: Round = { center: [264, 150], rx: 40, ry: 11 }
  return drawing(
    206,
    ...drawBox(box([42, 150], 58, [-24, -14], 82), false),
    polygon([lift(p.A), lift(p.B), lift(p.C), lift(p.D)], sectionStyle),
    ...cylinder(cyl, 90),
    ellipse([160, 106], 36, 10, sectionStyle),
    ...coneUp(cone, 100),
    ellipse([264, 100], 20, 5.5, sectionStyle),
    note([62, 176], 'pavé droit'),
    text([62, 195], 'rectangle', { size: 14, color: ACCENT, weight: 700 }),
    note([160, 176], 'cylindre'),
    text([160, 195], 'disque', { size: 14, color: ACCENT, weight: 700 }),
    note([264, 176], 'cône'),
    text([264, 195], 'disque réduit', { size: 14, color: ACCENT, weight: 700 }),
  )
}

interface SphereCut {
  /** OH ÷ R : la place du plan, entre 0 et 1. */
  ratio: number
  om?: string
  oh?: string
  hm?: string
}

/** Sphère de centre O coupée par un plan : le cercle de centre H et le triangle OHM. */
function sphereCut({ ratio, om, oh, hm }: SphereCut): Drawing {
  const o: Point = [150, 140]
  const radius = 100
  const h: Point = [o[0], o[1] - radius * ratio]
  const rx = radius * Math.sqrt(1 - ratio * ratio)
  const ry = rx * 0.24
  const m: Point = [h[0] + rx, h[1]]
  const back = 26
  return drawing(
    250,
    horizontalPlane([
      [o[0] - rx - 62, h[1] + back],
      [o[0] + rx + 30, h[1] + back],
      [o[0] + rx + 62, h[1] - back],
      [o[0] - rx - 30, h[1] - back],
    ]),
    circle(o, radius, { fill: PASTEL.lilas }),
    ellipse(h, rx, ry, { fill: PASTEL.citron, color: ACCENT }),
    segment(o, h, { color: INK }),
    segment(h, m, { color: INK }),
    segment(o, m, { color: INK }),
    rightAngle(h, o, m, { size: 9 }),
    dot(o, { radius: 3 }),
    dot(h, { radius: 3 }),
    dot(m, { radius: 3 }),
    text([o[0] - 4, o[1] + 14], 'O', { weight: 700, anchor: 'end' }),
    text([h[0] - 8, h[1] - 10], 'H', { weight: 700, anchor: 'end' }),
    text([m[0] + 8, m[1] - 10], 'M', { weight: 700, anchor: 'start' }),
    oh && text([o[0] - 8, o[1] - (o[1] - h[1]) * 0.33], oh, { anchor: 'end' }),
    hm &&
      text([(h[0] + m[0]) / 2, h[1] - 11], hm, {
        color: hm === UNKNOWN ? ACCENT : INK,
        weight: 700,
      }),
    om &&
      text([(o[0] + m[0]) / 2 + 14, (o[1] + m[1]) / 2 + 12], om, {
        anchor: 'start',
      }),
  )
}

// Globe : projection orthographique, vue un peu au-dessus de l'équateur.
const TILT = (16 * Math.PI) / 180
const rad = (degrees: number) => (degrees * Math.PI) / 180

interface Globe {
  center: Point
  radius: number
}

/** Le point de latitude `lat` et de longitude `lon` (en degrés, est positif), et s'il est visible. */
function onGlobe({ center, radius }: Globe, lat: number, lon: number) {
  const phi = rad(lat)
  const lambda = rad(lon)
  const point: Point = [
    center[0] + radius * Math.cos(phi) * Math.sin(lambda),
    center[1] -
      radius * (Math.sin(phi) * Math.cos(TILT) - Math.cos(phi) * Math.cos(lambda) * Math.sin(TILT)),
  ]
  const depth = Math.cos(phi) * Math.cos(lambda) * Math.cos(TILT) + Math.sin(phi) * Math.sin(TILT)
  return { point, visible: depth >= 0 }
}

/** Une courbe tracée sur le globe : pleine devant, en pointillés derrière. */
function globeCurve(
  globe: Globe,
  sample: (t: number) => [lat: number, lon: number],
  style: { color?: string; width?: number; hidden?: boolean } = {},
): Part {
  const { color = INK, width = 1.75, hidden = true } = style
  const steps = 72
  const pieces: { visible: boolean; points: Point[] }[] = []
  for (let index = 0; index <= steps; index++) {
    const [lat, lon] = sample(index / steps)
    const { point, visible } = onGlobe(globe, lat, lon)
    const last = pieces[pieces.length - 1]
    if (last && last.visible === visible) last.points.push(point)
    else {
      if (last) last.points.push(point)
      pieces.push({ visible, points: [point] })
    }
  }
  return pieces
    .filter((piece) => piece.points.length > 1 && (piece.visible || hidden))
    .map((piece) =>
      piece.visible
        ? polyline(piece.points, { color, width })
        : polyline(piece.points, { color: GREY, width: 1.25, dashed: true }),
    )
    .join('')
}

interface GlobeOptions {
  lat: number
  lon: number
  latLabel: string
  lonLabel: string
  pointLabel: string
}

/** Le globe, l'équateur, le méridien de Greenwich, et un point avec son parallèle et son méridien. */
function globeFigure({ lat, lon, latLabel, lonLabel, pointLabel }: GlobeOptions): Drawing {
  const globe: Globe = { center: [124, 128], radius: 100 }
  const point = onGlobe(globe, lat, lon).point
  const foot = onGlobe(globe, 0, lon).point
  const north = onGlobe(globe, 90, 0).point
  const greenwichLabel = onGlobe(globe, 62, 0).point
  const equatorEnd = onGlobe(globe, 0, 72).point
  const latMiddle = onGlobe(globe, lat / 2, lon).point
  const lonMiddle = onGlobe(globe, 0, lon / 2).point
  const side = lon < 0 ? -1 : 1
  return drawing(
    252,
    circle(globe.center, globe.radius, { fill: PASTEL.ciel }),
    globeCurve(globe, (t) => [0, -180 + 360 * t]),
    globeCurve(globe, (t) => [lat, -180 + 360 * t], { color: GREY, width: 1.5 }),
    globeCurve(globe, (t) => [-90 + 180 * t, 0]),
    globeCurve(globe, (t) => [-90 + 180 * t, lon], { color: GREY, width: 1.5 }),
    globeCurve(globe, (t) => [lat * t, lon], { color: ACCENT, width: 3.5, hidden: false }),
    globeCurve(globe, (t) => [0, lon * t], { color: ACCENT, width: 3.5, hidden: false }),
    dot(north, { radius: 3 }),
    text([north[0], north[1] - 14], 'N', { weight: 700 }),
    dot(point, { radius: 4.5, color: ACCENT }),
    text([point[0] + side * 10, point[1] - 12], pointLabel, {
      weight: 700,
      anchor: side < 0 ? 'end' : 'start',
    }),
    text([latMiddle[0] + side * 9, latMiddle[1]], latLabel, {
      color: ACCENT,
      weight: 700,
      anchor: side < 0 ? 'end' : 'start',
    }),
    text([lonMiddle[0], lonMiddle[1] + 16], lonLabel, { color: ACCENT, weight: 700 }),
    dot(foot, { radius: 2.5 }),
    // Légendes, à droite du globe.
    segment(greenwichLabel, [238, 40], { color: GREY, width: 1 }),
    text([242, 32], 'méridien de', { size: 13, anchor: 'start' }),
    text([242, 48], 'Greenwich', { size: 13, anchor: 'start' }),
    segment(equatorEnd, [240, 200], { color: GREY, width: 1 }),
    text([238, 212], 'équateur', { size: 13, anchor: 'start' }),
  )
}

// ---------------------------------------------------------------------------
// Sections : exemples et questions

/** Cône de sommet S, coupé par un plan parallèle à la base, avec ses cotes. */
function coneCut(): Drawing {
  const base: Round = { center: [160, 200], rx: 76, ry: 20 }
  const apex: Point = [160, 40]
  const level = 40 + 160 * 0.4
  const small = 76 * 0.4
  return drawing(
    232,
    horizontalPlane([
      [70, level + 18],
      [222, level + 18],
      [252, level - 18],
      [100, level - 18],
    ]),
    ...coneUp(base, 160),
    ellipse([160, level], small, small * 0.26, { fill: PASTEL.citron, color: ACCENT }),
    dashed(apex, base.center, { width: 1.5 }),
    segment(base.center, [236, 200], { color: ACCENT }),
    dot(base.center, { radius: 2.5 }),
    text([198, 188], cm(15)),
    text([174, level - 15], UNKNOWN, { color: ACCENT, weight: 700 }),
    verticalDimension(264, 40, 200, cm(20), { from: [166, 240] }),
    verticalDimension(44, 40, level, cm(8), { side: 'right', from: [154, 70] }),
    pointName(apex, 'S', { angle: 90 }),
  )
}

/**
 * Pavé droit ABCDEFGH, coupé par un plan parallèle à la face ABCD. Le pavé est
 * dessiné en fil de fer, sans faces pleines : le plan se voit tout entier, à
 * travers lui, sans que soit tracé le contour de la section (la réponse).
 */
function paveCut(): Drawing {
  const width = 120
  const depth: Point = [-48, -30]
  const b = box([134, 160], width, depth, 56)
  const p = b.points
  // Le plan, à mi-hauteur, déborde nettement du pavé de tous côtés.
  const corner = (u: number, v: number): Point => [
    p.A[0] + u * width + v * depth[0],
    p.A[1] - 28 + v * depth[1],
  ]
  return drawing(
    196,
    polygon([corner(-0.3, -0.65), corner(1.25, -0.65), corner(1.25, 1.15), corner(-0.3, 1.15)], {
      fill: PASTEL.citron,
      color: GREY,
      width: 1.5,
    }),
    ...drawBox(b, true, false),
    lengthLabel(p.A, p.B, cm(8), { side: 'right', distance: 20 }),
    text([100, 168], cm(5)),
    text([p.H[0] - 8, p.H[1] + 8], cm(3), { anchor: 'end' }),
  )
}

/** Pavé droit dans son repère d'origine A, et le sommet F dont on cherche les coordonnées. */
function paveRepere(): Drawing {
  const b = box([115, 200], 150, [-60, -36], 80)
  const p = b.points
  const axis = { color: ACCENT, width: 2.5, head: 10 }
  return drawing(
    248,
    ...drawBox(b),
    arrow(p.A, p.B, axis),
    arrow(p.A, p.D, axis),
    arrow(p.A, p.E, axis),
    dot(p.F, { color: ACCENT, radius: 5 }),
    text([190, 216], cm(6)),
    text([190, 234], 'abscisse', { color: ACCENT, weight: 700 }),
    text([62, 206], cm(4)),
    text([62, 224], 'ordonnée', { color: ACCENT, weight: 700 }),
    text([124, 156], 'altitude', { color: ACCENT, weight: 700, anchor: 'start' }),
    text([273, 168], cm(3), { anchor: 'start' }),
    text([16, 30], 'F( ? ; ? ; ? )', { color: ACCENT, weight: 700, anchor: 'start' }),
  )
}

/** Cylindre coupé par un plan parallèle à sa base, à 3 cm de celle-ci. */
function cylinderHorizontalCut(): Drawing {
  const base: Round = { center: [138, 214], rx: 56, ry: 15 }
  const top: Point = [138, 44]
  const level = 214 - 51
  return drawing(
    242,
    horizontalPlane([
      [40, level + 14],
      [222, level + 14],
      [254, level - 14],
      [72, level - 14],
    ]),
    ...cylinder(base, 170),
    segment(top, [top[0] + base.rx, top[1]], { color: ACCENT }),
    dot(top, { radius: 2.5 }),
    text([top[0] + 28, top[1] - 24], cm(4)),
    verticalDimension(270, 44, 214, cm(10), { from: [200, 200] }),
    verticalDimension(30, level, 214, cm(3), { side: 'right', from: [76, 76] }),
  )
}

/** Cylindre et un plan vertical qui contient son axe (dessiné derrière). */
function cylinderAxisCut(): Drawing {
  const base: Round = { center: [150, 210], rx: 60, ry: 17 }
  const top: Point = [150, 62]
  const t = (30 * Math.PI) / 180
  const reach: Point = [86 * Math.cos(t), 17 * 1.45 * Math.sin(t)]
  const above = 24
  return drawing(
    252,
    polygon(
      [
        [top[0] - reach[0], top[1] - reach[1] - above],
        [top[0] + reach[0], top[1] + reach[1] - above],
        [base.center[0] + reach[0], base.center[1] + reach[1] + above],
        [base.center[0] - reach[0], base.center[1] - reach[1] + above],
      ],
      { fill: PASTEL.citron, color: GREY, width: 1.5 },
    ),
    ...cylinder(base, 148),
    dashed([150, 40], [150, 232], { color: ACCENT, width: 1.5 }),
    dot(top, { radius: 2.5 }),
    dot(base.center, { radius: 2.5 }),
    segment(top, [top[0] + base.rx, top[1]], { color: INK }),
    text([top[0] + 30, top[1] + 9], cm(3), { size: 13 }),
    verticalDimension(268, 62, 210, cm(7), { from: [216, 216] }),
  )
}

/** Pyramide de sommet S coupée par un plan parallèle à la base, dessiné derrière elle. */
function pyramidCut(): Drawing {
  const pyramid = squarePyramid([150, 210], 70, [52, -28], 172)
  const [a, b] = pyramid.base
  const level = pyramid.apex[1] + 172 * 0.25
  return drawing(
    246,
    horizontalPlane([
      [86, level + 16],
      [200, level + 16],
      [230, level - 16],
      [116, level - 16],
    ]),
    ...drawPyramid(pyramid),
    dashed(pyramid.apex, pyramid.center, { width: 1.5 }),
    lengthLabel(a, b, cm(12), { outside: pyramid.apex }),
    verticalDimension(288, pyramid.apex[1], pyramid.center[1], cm(24), {
      side: 'left',
      from: [156, 156],
    }),
    verticalDimension(48, pyramid.apex[1], level, cm(6), { side: 'right', from: [144, 90] }),
    pointName(pyramid.apex, 'S', { angle: 90 }),
  )
}

/** Gobelet conique posé pointe en bas, rempli d'eau jusqu'à 9 cm. */
function gobelet(): Drawing {
  const center: Point = [150, 44]
  const rx = 92
  const ry = 20
  const apex: Point = [150, 236]
  const level = 236 - 0.75 * 192
  const water = rx * 0.75
  const wl: Point = [150 - water, level]
  const wr: Point = [150 + water, level]
  return drawing(
    246,
    path(`M ${at(wl)} L ${at(apex)} L ${at(wr)} A ${water} ${ry * 0.75} 0 0 1 ${at(wl)} Z`, {
      fill: PASTEL.ciel,
      width: 0,
    }),
    ellipse([150, level], water, ry * 0.75, { fill: PASTEL.ciel, color: ACCENT }),
    segment([center[0] - rx, center[1]], apex),
    segment([center[0] + rx, center[1]], apex),
    ellipse(center, rx, ry),
    segment(center, [center[0] + rx, center[1]], { color: INK }),
    dot(center, { radius: 2.5 }),
    text([center[0] + rx / 2, center[1] - 9], cm(6), { size: 14 }),
    segment([150, level], wr, { color: ACCENT }),
    text([150 + water / 2, level + 8], UNKNOWN, { color: ACCENT, weight: 700 }),
    verticalDimension(282, 44, 236, cm(12), { side: 'left', from: [242, 156] }),
    verticalDimension(30, level, 236, cm(9), { side: 'right', from: [82, 144] }),
  )
}

export const espaceFigures: readonly FigureDefinition[] = [
  // Volumes : pyramide, cône, boule.
  defineFigure('volumes-rappel-tiers', volumesTiers()),
  defineFigure('volumes-rappel-cylindre-boule', volumesCylindreBoule()),
  defineFigure('volumes-ex-cone', coneWithSizes(cm(2), cm(6), 'V = ?')),
  defineFigure('volumes-ex-boule', ballWithSize(cm(6), 'V = ?')),
  defineFigure('volumes-q1-pyramide', volumesPyramide()),
  defineFigure('volumes-q2-cone', coneWithSizes(cm(5), cm(9), 'V = ?')),
  defineFigure('volumes-q3-boule', ballWithSize(cm(9), 'V = ?')),
  defineFigure('volumes-q4-sphere', ballWithSize(cm(10), 'aire = ?', true)),
  defineFigure('volumes-q5-recuperateur', recuperateur()),
  defineFigure('volumes-q6-cornet', cornet()),
  // Sections de solides et repérage.
  defineFigure('sections-rappel-solides', sectionsTrois()),
  defineFigure('sections-rappel-sphere', sphereCut({ ratio: 0.5, om: 'R' })),
  defineFigure(
    'sections-rappel-globe',
    globeFigure({ lat: 40, lon: 50, latLabel: 'latitude', lonLabel: 'longitude', pointLabel: 'M' }),
  ),
  defineFigure('sections-ex-cone', coneCut()),
  defineFigure('sections-ex-sphere', sphereCut({ ratio: 0.6, om: cm(5), oh: cm(3), hm: UNKNOWN })),
  defineFigure('sections-q1-pave', paveCut()),
  defineFigure('sections-q2-cylindre', cylinderHorizontalCut()),
  defineFigure('sections-q3-cylindre-axe', cylinderAxisCut()),
  defineFigure('sections-q4-pave-repere', paveRepere()),
  defineFigure(
    'sections-q5-voilier',
    globeFigure({ lat: 45, lon: -30, latLabel: '45°', lonLabel: '30°', pointLabel: 'voilier' }),
  ),
  defineFigure('sections-q6-pyramide', pyramidCut()),
  defineFigure(
    'sections-q7-sphere',
    sphereCut({ ratio: 5 / 13, om: cm(13), oh: cm(5), hm: UNKNOWN }),
  ),
  defineFigure('sections-q8-gobelet', gobelet()),
]
