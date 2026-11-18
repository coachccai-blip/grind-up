/**
 * Primitives de dessin des illustrations de la bibliothèque.
 *
 * Chaque fonction rend un morceau de SVG sous forme de chaîne, dans le style
 * commun : traits de 2 unités aux extrémités arrondies, encre bleu nuit, accent
 * bleu pour ce qu'on cherche, aplats pastel, texte en 15 avec un halo blanc.
 * `defineFigure` assemble les morceaux en un fichier SVG autonome de 320 unités
 * de large, la largeur utile d'un téléphone.
 *
 * Coordonnées : l'origine est en haut à gauche, x vers la droite, y vers le bas
 * (comme en SVG). Les angles, eux, se donnent en degrés comme en maths : 0 vers
 * la droite, 90 vers le haut, dans le sens inverse des aiguilles d'une montre.
 *
 * Ce fichier et families.ts sont communs à tous les thèmes : on ne les modifie
 * pas pour une figure particulière. Une figure se dessine dans le fichier de
 * son thème (calcul-litteral.ts, geometrie.ts…).
 */

export type Point = readonly [x: number, y: number]

/** Un morceau de dessin ; false, null et undefined ne dessinent rien (pratique pour `cond && …`). */
export type Part = string | false | null | undefined

export const WIDTH = 320
export const MIN_HEIGHT = 120
export const MAX_HEIGHT = 260

/** Couleurs de l'application. */
export const INK = '#1f2a44'
export const GREY = '#5b6b8a'
/** L'inconnue, ce qu'on cherche, ce qu'on met en valeur. */
export const ACCENT = '#2a66d9'
export const WHITE = '#ffffff'
/** Aplats pastel, pour remplir une surface ou distinguer des parts. */
export const PASTEL = {
  lilas: '#e4e1ff',
  menthe: '#d5f3ea',
  peche: '#ffe5d6',
  citron: '#fff3c9',
  ciel: '#cfe8ff',
  anis: '#e1f5c4',
  rose: '#ffdde1',
} as const
/** Toutes les couleurs permises dans une figure (un test le vérifie). */
export const PALETTE: readonly string[] = [INK, GREY, ACCENT, WHITE, ...Object.values(PASTEL)]

export const FONT_FAMILY = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
export const FONT_SIZE = 15
export const SMALL_FONT_SIZE = 13
export const STROKE_WIDTH = 2

// ---------------------------------------------------------------------------
// Écriture du SVG

/** Un nombre écrit court : un chiffre après la virgule au plus. */
const num = (value: number) => String(Math.round(value * 10) / 10)

/**
 * Échappe un texte pour le SVG. Les espaces insécables s'écrivent en entités,
 * pour rester visibles dans le fichier : « 3,5&#160;cm ».
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\u00A0/g, '&#160;')
    .replace(/\u202F/g, '&#8239;')
}

type AttributeValue = string | number | false | null | undefined

/** Un élément SVG ; les attributs à false, null ou undefined sont omis. */
export function element(
  name: string,
  attributes: Record<string, AttributeValue>,
  content?: string,
): string {
  const written = Object.entries(attributes)
    .filter((entry): entry is [string, string | number] => {
      const value = entry[1]
      return value !== false && value !== null && value !== undefined
    })
    .map(([key, value]) => ` ${key}="${typeof value === 'number' ? num(value) : escapeXml(value)}"`)
    .join('')
  return content === undefined ? `<${name}${written}/>` : `<${name}${written}>${content}</${name}>`
}

/** Regroupe des morceaux ; `attributes` permet par exemple une translation commune. */
export const group = (parts: readonly Part[], attributes: Record<string, AttributeValue> = {}) =>
  element('g', attributes, join(parts))

const join = (parts: readonly Part[]) => parts.filter((part) => !!part).join('')

// ---------------------------------------------------------------------------
// Nombres à la française

/** Un nombre écrit à la française : virgule décimale, signe moins typographique. */
export function frenchNumber(value: number, decimals?: number): string {
  const fixed = decimals === undefined ? String(value) : value.toFixed(decimals)
  return fixed.replace('-', '−').replace('.', ',')
}

/** Un nombre et son unité, qui ne se séparent pas : « 3,5 cm » avec une espace insécable. */
export const withUnit = (value: number | string, unit: string) =>
  `${typeof value === 'number' ? frenchNumber(value) : value}\u00A0${unit}`

// ---------------------------------------------------------------------------
// Géométrie du plan

export const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]]
export const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]]
export const scale = (a: Point, k: number): Point => [a[0] * k, a[1] * k]
export const length = (a: Point) => Math.hypot(a[0], a[1])
export const distance = (a: Point, b: Point) => length(sub(b, a))
export const middle = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
export const unit = (a: Point): Point => {
  const size = length(a)
  return size === 0 ? [0, 0] : [a[0] / size, a[1] / size]
}
/** Le point situé à une fraction `t` du chemin de a vers b. */
export const lerp = (a: Point, b: Point, t: number): Point => add(a, scale(sub(b, a), t))
/** Le centre de gravité d'un ensemble de points. */
export const centroid = (points: readonly Point[]): Point =>
  scale(
    points.reduce<Point>((total, point) => add(total, point), [0, 0]),
    1 / Math.max(points.length, 1),
  )
/** Le vecteur unitaire de l'angle donné (en degrés, sens des maths). */
export const direction = (degrees: number): Point => {
  const radians = (degrees * Math.PI) / 180
  return [Math.cos(radians), -Math.sin(radians)]
}
/** L'angle (en degrés, sens des maths) du vecteur allant de a vers b. */
export const angleOf = (a: Point, b: Point) =>
  (Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180) / Math.PI
/** Le point à `radius` du centre, dans la direction `degrees`. */
export const polar = (center: Point, radius: number, degrees: number): Point =>
  add(center, scale(direction(degrees), radius))

// ---------------------------------------------------------------------------
// Style des traits

export interface StrokeStyle {
  /** Couleur du trait ; l'encre par défaut. */
  color?: string
  /** Épaisseur ; 2 par défaut. */
  width?: number
  /** Pointillés, pour un trait de construction ou une arête cachée. */
  dashed?: boolean
  /** Couleur de remplissage d'une surface ; aucune par défaut. */
  fill?: string
}

const strokeAttributes = ({ color = INK, width = STROKE_WIDTH, dashed, fill }: StrokeStyle) => ({
  fill: fill ?? 'none',
  stroke: color,
  'stroke-width': width,
  'stroke-dasharray': dashed ? `${num(width * 2.5)} ${num(width * 3)}` : undefined,
})

// ---------------------------------------------------------------------------
// Tracés

/** Segment [AB]. */
export const segment = (a: Point, b: Point, style: StrokeStyle = {}) =>
  element('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], ...strokeAttributes(style) })

/** Trait en pointillés : un segment de construction. */
export const dashed = (a: Point, b: Point, style: StrokeStyle = {}) =>
  segment(a, b, { color: GREY, ...style, dashed: true })

/** Droite (AB) : le segment prolongé de `extend` unités de part et d'autre. */
export function line(
  a: Point,
  b: Point,
  { extend = 24, ...style }: StrokeStyle & { extend?: number } = {},
) {
  const u = unit(sub(b, a))
  return segment(sub(a, scale(u, extend)), add(b, scale(u, extend)), style)
}

/** Ligne brisée ouverte. */
export const polyline = (points: readonly Point[], style: StrokeStyle = {}) =>
  element('polyline', {
    points: points.map((p) => `${num(p[0])},${num(p[1])}`).join(' '),
    ...strokeAttributes(style),
  })

/** Polygone fermé, éventuellement rempli. */
export const polygon = (points: readonly Point[], style: StrokeStyle = {}) =>
  element('polygon', {
    points: points.map((p) => `${num(p[0])},${num(p[1])}`).join(' '),
    ...strokeAttributes(style),
  })

/** Rectangle de coin haut gauche `at`. */
export const rect = (
  at: Point,
  width: number,
  height: number,
  style: StrokeStyle & { radius?: number } = {},
) =>
  element('rect', {
    x: at[0],
    y: at[1],
    width,
    height,
    rx: style.radius,
    ...strokeAttributes(style),
  })

export const circle = (center: Point, radius: number, style: StrokeStyle = {}) =>
  element('circle', { cx: center[0], cy: center[1], r: radius, ...strokeAttributes(style) })

/** Ellipse : la base d'un cylindre ou d'un cône vue en perspective. */
export const ellipse = (center: Point, rx: number, ry: number, style: StrokeStyle = {}) =>
  element('ellipse', { cx: center[0], cy: center[1], rx, ry, ...strokeAttributes(style) })

/** Chemin libre, en syntaxe SVG (« M 10 10 L 50 30 Q … ») : pour une scène ou un solide. */
export const path = (d: string, style: StrokeStyle = {}) =>
  element('path', { d, ...strokeAttributes(style) })

/** Le tracé « d » d'un arc de cercle, de l'angle `from` à l'angle `to` (degrés, sens des maths). */
export function arcPath(center: Point, radius: number, from: number, to: number): string {
  const sweep = (((to - from) % 360) + 360) % 360
  const start = polar(center, radius, from)
  const end = polar(center, radius, from + sweep)
  return `M ${num(start[0])} ${num(start[1])} A ${num(radius)} ${num(radius)} 0 ${sweep > 180 ? 1 : 0} 0 ${num(end[0])} ${num(end[1])}`
}

/** Arc de cercle, de l'angle `from` à l'angle `to`, dans le sens des maths. */
export const arc = (
  center: Point,
  radius: number,
  from: number,
  to: number,
  style: StrokeStyle = {},
) => path(arcPath(center, radius, from, to), style)

/** Secteur (part de disque), de l'angle `from` à l'angle `to`. */
export function sector(
  center: Point,
  radius: number,
  from: number,
  to: number,
  style: StrokeStyle = {},
) {
  const sweep = (((to - from) % 360) + 360) % 360
  const start = polar(center, radius, from)
  const end = polar(center, radius, from + sweep)
  return path(
    `M ${num(center[0])} ${num(center[1])} L ${num(start[0])} ${num(start[1])} A ${num(radius)} ${num(radius)} 0 ${sweep > 180 ? 1 : 0} 0 ${num(end[0])} ${num(end[1])} Z`,
    style,
  )
}

/** Pointe de flèche pleine, posée en `tip`, orientée selon le vecteur `toward`. */
function arrowHead(tip: Point, toward: Point, size: number, color: string) {
  const u = unit(toward)
  const back = sub(tip, scale(u, size))
  const normal: Point = [-u[1], u[0]]
  return polygon(
    [tip, add(back, scale(normal, size * 0.55)), sub(back, scale(normal, size * 0.55))],
    {
      color,
      fill: color,
      width: 1,
    },
  )
}

export interface ArrowStyle extends StrokeStyle {
  /** Taille de la pointe ; 9 par défaut. */
  head?: number
  /** Une pointe aux deux bouts. */
  both?: boolean
}

/** Flèche droite de a vers b. */
export function arrow(a: Point, b: Point, { head = 9, both = false, ...style }: ArrowStyle = {}) {
  const u = unit(sub(b, a))
  const color = style.color ?? INK
  return join([
    segment(both ? add(a, scale(u, head * 0.8)) : a, sub(b, scale(u, head * 0.8)), style),
    arrowHead(b, u, head, color),
    both && arrowHead(a, scale(u, -1), head, color),
  ])
}

/**
 * Flèche courbe de a vers b, bombée de `bend` unités vers la gauche du trajet
 * (une valeur négative bombe vers la droite) : les « × k » d'un tableau.
 */
export function curvedArrow(
  a: Point,
  b: Point,
  bend: number,
  { head = 8, ...style }: ArrowStyle = {},
) {
  const u = unit(sub(b, a))
  const normal: Point = [u[1], -u[0]]
  const control = add(middle(a, b), scale(normal, bend * 2))
  const tangent = sub(b, control)
  const end = sub(b, scale(unit(tangent), head * 0.8))
  return join([
    path(
      `M ${num(a[0])} ${num(a[1])} Q ${num(control[0])} ${num(control[1])} ${num(end[0])} ${num(end[1])}`,
      style,
    ),
    arrowHead(b, tangent, head, style.color ?? INK),
  ])
}

/** Le sommet d'une flèche courbe : là où poser son étiquette. */
export function curvedArrowTop(a: Point, b: Point, bend: number): Point {
  const u = unit(sub(b, a))
  return add(middle(a, b), scale([u[1], -u[0]], bend))
}

// ---------------------------------------------------------------------------
// Texte

export interface TextStyle {
  /** 15 par défaut ; jamais moins de 13. */
  size?: number
  /** 600 par défaut, 700 pour ce qu'on met en avant. */
  weight?: 600 | 700
  color?: string
  /** Alignement horizontal sur le point donné ; centré par défaut. */
  anchor?: 'start' | 'middle' | 'end'
  /** Halo blanc sous le texte, pour qu'il reste lisible sur un trait ; oui par défaut. */
  halo?: boolean
  italic?: boolean
}

/**
 * Largeur approximative d'un texte, pour placer une étiquette sans chevauchement.
 * Une estimation suffit : les étiquettes sont courtes.
 */
export function textWidth(content: string, size = FONT_SIZE, weight: 600 | 700 = 600): number {
  let units = 0
  for (const char of content) {
    if (/[ \u00A0\u202F]/.test(char)) units += 0.28
    else if (/[.,:;'’|!iIlj]/.test(char)) units += 0.27
    else if (/[()[\]f t r]/.test(char)) units += 0.36
    else if (/[²³⁻¹⁰⁴⁵⁶⁷⁸⁹]/.test(char)) units += 0.38
    else if (/[mwMW]/.test(char)) units += 0.85
    else if (/[A-Z]/.test(char)) units += 0.66
    else if (/[0-9]/.test(char)) units += 0.57
    else if (/[×−+=<>≈÷→]/.test(char)) units += 0.6
    else units += 0.54
  }
  return units * size * (weight === 700 ? 1.04 : 1)
}

/** Hauteur d'une ligne de texte de cette taille. */
export const textHeight = (size = FONT_SIZE) => size * 1.15

/** Texte centré verticalement sur le point donné. */
export function text(at: Point, content: string, style: TextStyle = {}) {
  const {
    size = FONT_SIZE,
    weight = 600,
    color = INK,
    anchor = 'middle',
    halo = true,
    italic,
  } = style
  if (size < SMALL_FONT_SIZE) throw new Error(`Texte trop petit (${size})\u00A0: ${content}`)
  return element(
    'text',
    {
      x: at[0],
      y: at[1],
      'font-size': size,
      'font-weight': weight,
      'font-style': italic ? 'italic' : undefined,
      fill: color,
      'text-anchor': anchor,
      'dominant-baseline': 'central',
      stroke: halo ? WHITE : undefined,
      'stroke-width': halo ? 4 : undefined,
      'stroke-linejoin': halo ? 'round' : undefined,
      'paint-order': halo ? 'stroke' : undefined,
    },
    escapeXml(content),
  )
}

/**
 * Place une étiquette à `distance` du point `at`, dans la direction `toward`
 * (un vecteur), en tenant compte de sa taille : la boîte du texte ne touche
 * jamais le point.
 */
export function labelAway(
  at: Point,
  toward: Point,
  content: string,
  distance = 6,
  style: TextStyle = {},
) {
  const u = unit(toward)
  const size = style.size ?? FONT_SIZE
  const halfWidth = textWidth(content, size, style.weight) / 2
  const halfHeight = textHeight(size) / 2
  const reach = distance + Math.abs(u[0]) * halfWidth + Math.abs(u[1]) * halfHeight
  return text(add(at, scale(u, reach)), content, { ...style, anchor: 'middle' })
}

// ---------------------------------------------------------------------------
// Codages de géométrie

/** Petit point plein : un point marqué. */
export const dot = (
  at: Point,
  { radius = 3.5, color = INK }: { radius?: number; color?: string } = {},
) => circle(at, radius, { color, fill: color, width: 1 })

export interface PointNameOptions {
  /**
   * D'où s'écarter : la lettre se place à l'opposé de ce point (le centre du
   * triangle, par exemple). Sinon, `angle` donne la direction en degrés.
   */
  awayFrom?: Point
  angle?: number
  /** Marquer le point d'un petit disque ; non par défaut (un sommet se voit déjà). */
  marked?: boolean
  color?: string
}

/** Point nommé : la lettre placée du bon côté, hors de la figure. */
export function pointName(at: Point, name: string, options: PointNameOptions = {}) {
  const { awayFrom, angle = 45, marked = false, color = INK } = options
  const toward = awayFrom ? sub(at, awayFrom) : direction(angle)
  return join([
    marked && dot(at, { color }),
    labelAway(at, toward, name, marked ? 5 : 3, { weight: 700, color, italic: false }),
  ])
}

export interface LengthLabelOptions {
  /** Un point intérieur à la figure (son centre) : l'étiquette se place de l'autre côté du segment. */
  outside?: Point
  /** Sinon : de quel côté du trajet de a vers b, à gauche (par défaut) ou à droite. */
  side?: 'left' | 'right'
  /** Écart entre le segment et l'étiquette ; 5 par défaut. */
  distance?: number
  color?: string
  weight?: 600 | 700
  size?: number
}

/** Étiquette de longueur au milieu d'un segment, placée à l'extérieur de la figure. */
export function lengthLabel(a: Point, b: Point, content: string, options: LengthLabelOptions = {}) {
  const { outside, side = 'left', distance = 5, color = INK, weight = 600, size } = options
  const u = unit(sub(b, a))
  let normal: Point = side === 'left' ? [u[1], -u[0]] : [-u[1], u[0]]
  const mid = middle(a, b)
  if (outside) {
    const inward = sub(outside, mid)
    if (normal[0] * inward[0] + normal[1] * inward[1] > 0) normal = scale(normal, -1)
  }
  return labelAway(mid, normal, content, distance, { color, weight, size })
}

/** Marque d'angle droit au sommet `vertex`, entre les directions de `a` et de `b`. */
export function rightAngle(
  vertex: Point,
  a: Point,
  b: Point,
  { size = 11, color = INK }: { size?: number; color?: string } = {},
) {
  const ua = scale(unit(sub(a, vertex)), size)
  const ub = scale(unit(sub(b, vertex)), size)
  return polyline([add(vertex, ua), add(add(vertex, ua), ub), add(vertex, ub)], {
    color,
    width: 1.5,
  })
}

export interface AngleMarkOptions {
  /** Rayon de l'arc ; 22 par défaut. */
  radius?: number
  /** La mesure (« 35° ») ou « ? ». */
  label?: string
  color?: string
  /** Deux arcs, pour distinguer deux angles égaux d'un autre couple. */
  double?: boolean
}

/** Arc d'angle au sommet `vertex`, entre les directions de `a` et de `b`, avec sa mesure. */
export function angleMark(vertex: Point, a: Point, b: Point, options: AngleMarkOptions = {}) {
  const { radius = 22, label, color = INK, double = false } = options
  let from = angleOf(vertex, a)
  let to = angleOf(vertex, b)
  // L'arc suit le plus petit des deux angles.
  if ((((to - from) % 360) + 360) % 360 > 180) [from, to] = [to, from]
  const sweep = (((to - from) % 360) + 360) % 360
  const bisector = from + sweep / 2
  return join([
    arc(vertex, radius, from, to, { color, width: 1.5 }),
    double && arc(vertex, radius + 4, from, to, { color, width: 1.5 }),
    label &&
      labelAway(polar(vertex, radius + (double ? 4 : 0), bisector), direction(bisector), label, 3, {
        color,
        weight: 700,
      }),
  ])
}

/** Codage de longueurs égales : `count` petits traits en travers du milieu du segment. */
export function equalTicks(
  a: Point,
  b: Point,
  count = 1,
  { size = 7, color = INK }: { size?: number; color?: string } = {},
) {
  const u = unit(sub(b, a))
  const normal: Point = [-u[1], u[0]]
  const mid = middle(a, b)
  return join(
    Array.from({ length: count }, (_, index) => {
      const center = add(mid, scale(u, (index - (count - 1) / 2) * 5))
      return segment(add(center, scale(normal, size)), sub(center, scale(normal, size)), {
        color,
        width: 1.5,
      })
    }),
  )
}

export interface BraceOptions {
  /** Un point du côté opposé à l'accolade : elle s'ouvre vers lui. Sinon, à gauche du trajet de a vers b. */
  outside?: Point
  /** Écart entre le segment mesuré et l'accolade ; 6 par défaut. */
  offset?: number
  /** Profondeur de l'accolade ; 10 par défaut. */
  depth?: number
  color?: string
  labelColor?: string
}

/** Côté où se placent l'accolade et la cote : le vecteur normal unitaire. */
function outerNormal(a: Point, b: Point, outside?: Point): Point {
  const u = unit(sub(b, a))
  let normal: Point = [u[1], -u[0]]
  if (outside) {
    const inward = sub(outside, middle(a, b))
    if (normal[0] * inward[0] + normal[1] * inward[1] > 0) normal = scale(normal, -1)
  }
  return normal
}

/** Accolade le long de [ab], avec son étiquette (« a + b ») à l'extérieur. */
export function brace(a: Point, b: Point, label: string, options: BraceOptions = {}) {
  const { outside, offset = 6, depth = 10, color = GREY, labelColor = INK } = options
  const normal = outerNormal(a, b, outside)
  const u = unit(sub(b, a))
  const span = distance(a, b)
  const half = depth / 2
  const at = (along: number, out: number): Point =>
    add(add(a, scale(u, along)), scale(normal, offset + out))
  const p = (point: Point) => `${num(point[0])} ${num(point[1])}`
  const d = [
    `M ${p(at(0, 0))}`,
    `Q ${p(at(0, half))} ${p(at(half, half))}`,
    `L ${p(at(span / 2 - half, half))}`,
    `Q ${p(at(span / 2, half))} ${p(at(span / 2, depth))}`,
    `Q ${p(at(span / 2, half))} ${p(at(span / 2 + half, half))}`,
    `L ${p(at(span - half, half))}`,
    `Q ${p(at(span, half))} ${p(at(span, 0))}`,
  ].join(' ')
  return join([
    path(d, { color, width: 1.5 }),
    labelAway(at(span / 2, depth), normal, label, 3, { color: labelColor }),
  ])
}

/** Cote : un trait parallèle à [ab], fermé par deux petits traits, et la longueur au milieu. */
export function dimension(
  a: Point,
  b: Point,
  label: string,
  options: Omit<BraceOptions, 'depth'> = {},
) {
  const { outside, offset = 14, color = GREY, labelColor = INK } = options
  const normal = outerNormal(a, b, outside)
  const shift = scale(normal, offset)
  const start = add(a, shift)
  const end = add(b, shift)
  return join([
    arrow(start, end, { color, width: 1.5, head: 7, both: true }),
    segment(add(a, scale(normal, offset - 5)), add(a, scale(normal, offset + 5)), {
      color,
      width: 1.5,
    }),
    segment(add(b, scale(normal, offset - 5)), add(b, scale(normal, offset + 5)), {
      color,
      width: 1.5,
    }),
    text(middle(start, end), label, { color: labelColor }),
  ])
}

// ---------------------------------------------------------------------------
// Repère

export interface PlaneOptions {
  /** Abscisses montrées : de x[0] à x[1]. */
  x: readonly [number, number]
  /** Ordonnées montrées : de y[0] à y[1]. */
  y: readonly [number, number]
  /** Longueur d'une unité, en unités de dessin. */
  unit: number
  /** Position du coin haut gauche du quadrillage ; centré horizontalement par défaut, 12 du haut. */
  left?: number
  top?: number
  /** Graduer de `step` en `step` ; 1 par défaut. */
  step?: number
}

export interface Plane {
  /** Le point de dessin des coordonnées (x ; y). */
  at: (x: number, y: number) => Point
  /**
   * Quadrillage, axes gradués et origine. Une graduation que coupe l'un des
   * segments `avoid` (les droites tracées) n'est pas écrite : elle serait illisible.
   */
  draw: (avoid?: readonly (readonly [Point, Point])[]) => string
  /** La droite d'équation y = f(x), coupée au bord du quadrillage. */
  plot: (f: (x: number) => number, style?: StrokeStyle) => string
  /** La partie visible de la droite y = f(x), dans le quadrillage ; null si elle n'y passe pas. */
  visible: (f: (x: number) => number) => readonly [Point, Point] | null
  /** Un point marqué, avec son nom et, si demandé, ses pointillés vers les axes. */
  point: (
    x: number,
    y: number,
    name?: string,
    options?: { guides?: boolean; color?: string; angle?: number },
  ) => string
  /** Hauteur occupée, marges comprises. */
  height: number
}

/** Coupe le segment [pq] au rectangle donné (algorithme de Liang et Barsky). */
function clip(
  p: Point,
  q: Point,
  box: { left: number; right: number; top: number; bottom: number },
) {
  let t0 = 0
  let t1 = 1
  const dx = q[0] - p[0]
  const dy = q[1] - p[1]
  const edges: [number, number][] = [
    [-dx, p[0] - box.left],
    [dx, box.right - p[0]],
    [-dy, p[1] - box.top],
    [dy, box.bottom - p[1]],
  ]
  for (const [pk, qk] of edges) {
    if (pk === 0) {
      if (qk < 0) return null
      continue
    }
    const t = qk / pk
    if (pk < 0) t0 = Math.max(t0, t)
    else t1 = Math.min(t1, t)
    if (t0 > t1) return null
  }
  return [lerp(p, q, t0), lerp(p, q, t1)] as const
}

/** Repère orthonormé avec quadrillage : tracer des droites, placer des points. */
export function plane(options: PlaneOptions): Plane {
  const { x, y, unit: u, step = 1 } = options
  const width = (x[1] - x[0]) * u
  const height = (y[1] - y[0]) * u
  const left = options.left ?? (WIDTH - width) / 2
  const top = options.top ?? 12
  const at = (px: number, py: number): Point => [left + (px - x[0]) * u, top + (y[1] - py) * u]
  const box = { left, right: left + width, top, bottom: top + height }
  const origin = at(0, 0)
  const ticks = (from: number, to: number) => {
    const values: number[] = []
    for (let value = Math.ceil(from / step) * step; value <= to; value += step) values.push(value)
    return values
  }

  const draw = (avoid: readonly (readonly [Point, Point])[] = []) => {
    const grid: string[] = []
    for (let value = Math.ceil(x[0]); value <= x[1]; value++)
      grid.push(segment(at(value, y[0]), at(value, y[1]), { color: PASTEL.ciel, width: 1 }))
    for (let value = Math.ceil(y[0]); value <= y[1]; value++)
      grid.push(segment(at(x[0], value), at(x[1], value), { color: PASTEL.ciel, width: 1 }))
    const axes = [
      x[0] <= 0 && 0 <= x[1] && arrow(at(0, y[0]), [origin[0], top - 6], { width: 1.5, head: 8 }),
      y[0] <= 0 &&
        0 <= y[1] &&
        arrow(at(x[0], 0), [left + width + 6, origin[1]], { width: 1.5, head: 8 }),
    ]
    /** Une graduation, sauf si une droite tracée passe dessus. */
    const graduation = (center: Point, value: string, anchor: 'middle' | 'end') => {
      const halfWidth = textWidth(value, 13) / 2 + 2
      const halfHeight = textHeight(13) / 2
      const middleX = anchor === 'end' ? center[0] - halfWidth + 2 : center[0]
      const label = {
        left: middleX - halfWidth,
        right: middleX + halfWidth,
        top: center[1] - halfHeight,
        bottom: center[1] + halfHeight,
      }
      if (avoid.some(([p, q]) => clip(p, q, label) !== null)) return ''
      return text(center, value, { size: 13, color: GREY, anchor })
    }
    const labels = [
      ...ticks(x[0], x[1] - 0.5)
        .filter((value) => value !== 0)
        .map((value) => graduation(add(at(value, 0), [0, 11]), frenchNumber(value), 'middle')),
      ...ticks(y[0], y[1] - 0.5)
        .filter((value) => value !== 0)
        .map((value) => graduation(add(at(0, value), [-6, 0]), frenchNumber(value), 'end')),
      graduation(add(origin, [-6, 11]), '0', 'end'),
    ]
    const marks = [
      ...ticks(x[0], x[1]).map((value) =>
        segment(add(at(value, 0), [0, -3]), add(at(value, 0), [0, 3]), { width: 1.5 }),
      ),
      ...ticks(y[0], y[1]).map((value) =>
        segment(add(at(0, value), [-3, 0]), add(at(0, value), [3, 0]), { width: 1.5 }),
      ),
    ]
    return join([...grid, ...axes, ...marks, ...labels])
  }

  const visible = (f: (value: number) => number) => clip(at(x[0], f(x[0])), at(x[1], f(x[1])), box)

  return {
    at,
    draw,
    plot: (f, style = {}) => {
      const piece = visible(f)
      return piece ? segment(piece[0], piece[1], { color: ACCENT, width: 2.5, ...style }) : ''
    },
    visible,
    point: (px, py, name, { guides = false, color = INK, angle = 45 } = {}) =>
      join([
        guides && dashed(at(px, py), at(px, 0), { width: 1.5 }),
        guides && dashed(at(px, py), at(0, py), { width: 1.5 }),
        dot(at(px, py), { color }),
        name && pointName(at(px, py), name, { angle, color }),
      ]),
    height: top + height + 24,
  }
}

// ---------------------------------------------------------------------------
// Assemblage

export interface Drawing {
  /** Hauteur de la zone de dessin, de 120 à 260. */
  height: number
  parts: readonly Part[]
}

/** Une zone de dessin de 320 de large et de la hauteur donnée, et ce qu'on y dessine. */
export const drawing = (height: number, ...parts: Part[]): Drawing => ({ height, parts })

/** Ajoute des morceaux à un dessin (une étiquette, une flèche) sans changer sa hauteur. */
export const withParts = (base: Drawing, ...parts: Part[]): Drawing => ({
  height: base.height,
  parts: [...base.parts, ...parts],
})

/** Décale tout un dessin, pour le recentrer ou le placer à côté d'un autre. */
export const shifted = (base: Drawing, dx: number, dy = 0): Part =>
  group(base.parts, { transform: `translate(${num(dx)} ${num(dy)})` })

export interface FigureDefinition {
  /** Identifiant : le fichier est public/figures/<id>.svg. */
  id: string
  /** Le fichier SVG complet. */
  svg: string
}

/** Une illustration, prête à être écrite dans public/figures/. */
export function defineFigure(id: string, { height, parts }: Drawing): FigureDefinition {
  const content = join(parts)
  const svg =
    element(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width: WIDTH,
        height: Math.round(height),
        viewBox: `0 0 ${WIDTH} ${Math.round(height)}`,
        'font-family': FONT_FAMILY,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      },
      content,
    ) + '\n'
  return { id, svg }
}
