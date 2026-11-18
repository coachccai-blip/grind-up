/**
 * Familles de figures : les schémas qui reviennent d'un exercice à l'autre,
 * construits avec les primitives de svg.ts. Chaque famille rend un `Drawing`
 * (sa hauteur et ses morceaux), que `defineFigure` transforme en fichier ; on
 * peut y ajouter des morceaux avec `withParts`.
 *
 * Commun à tous les thèmes : on ne modifie pas ce fichier pour une figure
 * particulière.
 */
import {
  ACCENT,
  add,
  arrow,
  centroid,
  circle,
  curvedArrow,
  curvedArrowTop,
  drawing,
  type Drawing,
  equalTicks,
  FONT_SIZE,
  GREY,
  INK,
  lengthLabel,
  lerp,
  type Part,
  PASTEL,
  plane,
  type Point,
  labelAway,
  pointName,
  polar,
  polygon,
  rect,
  rightAngle,
  angleMark,
  sector,
  segment,
  sub,
  text,
  textWidth,
  unit,
  WIDTH,
  WHITE,
} from './svg.js'

/** Ce qu'on cherche s'écrit « ? » et prend la couleur de l'accent. */
export const UNKNOWN = '?'
const colorOf = (label: string, unknown?: boolean) => (unknown || label === UNKNOWN ? ACCENT : INK)

// ---------------------------------------------------------------------------
// Triangle ou polygone étiqueté

export interface PolygonFigureOptions {
  /** Les sommets dans l'ordre du tour : leur nom et leur position. */
  vertices: readonly { name: string; at: Point }[]
  /** Les longueurs à écrire, désignées par les noms de leurs extrémités : « 6 cm », ou « ? ». */
  sides?: readonly { from: string; to: string; label: string; unknown?: boolean }[]
  /** Les sommets où marquer un angle droit. */
  rightAngles?: readonly string[]
  /** Les angles à marquer d'un arc, avec leur mesure ou « ? ». */
  angles?: readonly { at: string; label?: string; unknown?: boolean }[]
  /** Les côtés de même longueur : [de, vers, nombre de traits]. */
  equal?: readonly (readonly [from: string, to: string, count: number])[]
  /** Aplat pastel de la surface ; lilas par défaut, null pour aucun. */
  fill?: string | null
  height: number
}

/**
 * Triangle (ou tout polygone) avec ses sommets nommés hors de la figure, ses
 * longueurs à l'extérieur des côtés, ses angles droits et ses angles marqués.
 * La longueur cherchée s'écrit « ? », en bleu.
 *
 * Pour une figure « à main levée » (rectangle ou non ? parallèles ou non ?),
 * choisir des positions qui ne trahissent pas la réponse et ne pas coder ce
 * que l'élève doit démontrer.
 */
export function polygonFigure(options: PolygonFigureOptions): Drawing {
  const { vertices, sides = [], rightAngles = [], angles = [], equal = [], height } = options
  const fill = options.fill === undefined ? PASTEL.lilas : options.fill
  const points = vertices.map((vertex) => vertex.at)
  const center = centroid(points)
  const find = (name: string) => {
    const index = vertices.findIndex((vertex) => vertex.name === name)
    if (index < 0) throw new Error(`Sommet inconnu\u00A0: ${name}`)
    return index
  }
  const pointOf = (name: string) => points[find(name)]!
  /** Les deux voisins d'un sommet dans le tour du polygone. */
  const neighbours = (name: string): [Point, Point] => {
    const index = find(name)
    return [
      points[(index + points.length - 1) % points.length]!,
      points[(index + 1) % points.length]!,
    ]
  }

  return drawing(
    height,
    polygon(points, { fill: fill ?? undefined }),
    ...rightAngles.map((name) => rightAngle(pointOf(name), ...neighbours(name))),
    ...angles.map(({ at, label, unknown }) =>
      angleMark(pointOf(at), ...neighbours(at), {
        label,
        color: label ? colorOf(label, unknown) : INK,
      }),
    ),
    ...equal.map(([from, to, count]) => equalTicks(pointOf(from), pointOf(to), count)),
    ...sides.map(({ from, to, label, unknown }) =>
      lengthLabel(pointOf(from), pointOf(to), label, {
        outside: center,
        color: colorOf(label, unknown),
        weight: unknown || label === UNKNOWN ? 700 : 600,
      }),
    ),
    ...vertices.map(({ name, at }) => pointName(at, name, { awayFrom: center })),
  )
}

// ---------------------------------------------------------------------------
// Repère avec droites et points

export interface PlaneFigureOptions {
  x: readonly [number, number]
  y: readonly [number, number]
  unit: number
  step?: number
  /** Les droites y = f(x), chacune avec son nom posé au bout (« f », « (d) »). */
  lines?: readonly { f: (x: number) => number; name?: string; color?: string }[]
  /** Les points marqués ; `guides` trace leurs pointillés vers les axes. */
  points?: readonly {
    x: number
    y: number
    name?: string
    guides?: boolean
    angle?: number
    color?: string
  }[]
}

/** Repère orthonormé quadrillé, avec des droites et des points. */
export function planeFigure(options: PlaneFigureOptions): Drawing {
  const { lines = [], points = [] } = options
  const grid = plane(options)
  return drawing(
    grid.height,
    grid.draw(lines.map(({ f }) => grid.visible(f)).filter((piece) => piece !== null)),
    ...lines.map(({ f, color }) => grid.plot(f, color ? { color } : {})),
    ...lines.map(({ f, name, color = ACCENT }) => {
      const piece = grid.visible(f)
      if (!name || !piece) return ''
      // Le nom se pose près du bout visible de la droite, à gauche de son tracé.
      const u = unit(sub(piece[1], piece[0]))
      return labelAway(lerp(piece[0], piece[1], 0.86), [u[1], -u[0]], name, 6, {
        color,
        weight: 700,
      })
    }),
    ...points.map(({ x, y, name, guides, angle, color }) =>
      grid.point(x, y, name, { guides, angle, color }),
    ),
  )
}

// ---------------------------------------------------------------------------
// Tableau de valeurs ou de proportionnalité

export interface TableFigureOptions {
  /** Les lignes : leur titre (« Masse (kg) »), puis leurs valeurs. « ? » marque la valeur cherchée. */
  rows: readonly { label: string; values: readonly string[] }[]
  /** Flèche à droite, d'une ligne à l'autre : le coefficient « × 1,5 ». */
  factor?: { label: string; from?: number; to?: number }
  /** Flèches au-dessus ou au-dessous, d'une colonne à une autre : « × 2 ». */
  columnArrows?: readonly { from: number; to: number; label: string; side?: 'top' | 'bottom' }[]
}

const CELL_HEIGHT = 36

/** Tableau à deux lignes (ou plus), avec ses flèches « × k ». */
export function tableFigure(options: TableFigureOptions): Drawing {
  const { rows, factor, columnArrows = [] } = options
  const columns = Math.max(...rows.map((row) => row.values.length))
  const labelWidth = Math.max(...rows.map((row) => textWidth(row.label, FONT_SIZE, 700))) + 16
  const factorRoom = factor ? textWidth(factor.label, FONT_SIZE, 700) + 34 : 0
  const cellWidth = Math.min(64, (WIDTH - 8 - labelWidth - factorRoom) / columns)
  const tableWidth = labelWidth + cellWidth * columns
  const left = (WIDTH - tableWidth - factorRoom) / 2
  const hasTop = columnArrows.some((entry) => entry.side !== 'bottom')
  const hasBottom = columnArrows.some((entry) => entry.side === 'bottom')
  const top = hasTop ? 42 : 12
  const height = top + CELL_HEIGHT * rows.length + (hasBottom ? 42 : 12)
  const cellX = (column: number) => left + labelWidth + cellWidth * (column + 0.5)
  const rowY = (row: number) => top + CELL_HEIGHT * (row + 0.5)

  const parts: Part[] = [
    ...rows.map((_, row) =>
      rect([left, top + CELL_HEIGHT * row], labelWidth, CELL_HEIGHT, {
        fill: PASTEL.ciel,
        color: INK,
        width: 1.5,
      }),
    ),
    ...rows.flatMap((row, index) =>
      Array.from({ length: columns }, (_, column) =>
        rect(
          [left + labelWidth + cellWidth * column, top + CELL_HEIGHT * index],
          cellWidth,
          CELL_HEIGHT,
          {
            fill: WHITE,
            color: INK,
            width: 1.5,
          },
        ),
      ),
    ),
    ...rows.map((row, index) =>
      text([left + labelWidth / 2, rowY(index)], row.label, { weight: 700, halo: false }),
    ),
    ...rows.flatMap((row, index) =>
      row.values.map((value, column) =>
        text([cellX(column), rowY(index)], value, {
          color: colorOf(value),
          weight: value === UNKNOWN ? 700 : 600,
          halo: false,
        }),
      ),
    ),
  ]
  if (factor) {
    const from = factor.from ?? 0
    const to = factor.to ?? 1
    const x = left + tableWidth + 6
    const a: Point = [x, rowY(from)]
    const b: Point = [x, rowY(to)]
    const bend = (to > from ? -1 : 1) * 14
    parts.push(
      curvedArrow(a, b, bend, { color: ACCENT, width: 1.75 }),
      text(add(curvedArrowTop(a, b, bend), [6, 0]), factor.label, {
        color: ACCENT,
        weight: 700,
        anchor: 'start',
      }),
    )
  }
  for (const { from, to, label, side = 'top' } of columnArrows) {
    const y = side === 'top' ? top - 4 : top + CELL_HEIGHT * rows.length + 4
    const a: Point = [cellX(from), y]
    const b: Point = [cellX(to), y]
    const bend = (side === 'top') === to > from ? 12 : -12
    parts.push(
      curvedArrow(a, b, bend, { color: ACCENT, width: 1.75 }),
      text(add(curvedArrowTop(a, b, bend), [0, side === 'top' ? -9 : 9]), label, {
        color: ACCENT,
        weight: 700,
      }),
    )
  }
  return drawing(height, ...parts)
}

// ---------------------------------------------------------------------------
// Arbre

export interface TreeNode {
  /** Ce que porte le nœud : une issue (« P »), un nombre (« 60 »). */
  label: string
  /** Ce qu'on écrit sur la branche qui mène à ce nœud : une probabilité (« 1/3 »), un facteur. */
  edge?: string
  children?: readonly TreeNode[]
  /** Met le nœud en valeur (couleur de l'accent) : l'issue qui nous intéresse. */
  highlight?: boolean
}

export interface TreeFigureOptions {
  root: TreeNode
  /** Vers la droite (arbre de probabilités, par défaut) ou vers le bas (décomposition). */
  orientation?: 'right' | 'down'
  /** Ne pas écrire la racine : l'arbre part d'un point. Oui par défaut vers la droite. */
  hideRoot?: boolean
  height: number
}

/** Arbre des issues d'une expérience, ou arbre de décomposition d'un nombre. */
export function treeFigure(options: TreeFigureOptions): Drawing {
  const { root, orientation = 'right', height } = options
  const hideRoot = options.hideRoot ?? orientation === 'right'
  const depthOf = (node: TreeNode): number => 1 + Math.max(0, ...(node.children ?? []).map(depthOf))
  const leavesOf = (node: TreeNode): number =>
    node.children?.length ? node.children.reduce((total, child) => total + leavesOf(child), 0) : 1
  const depth = depthOf(root)
  const leaves = leavesOf(root)
  const margin = 18
  const along = orientation === 'right' ? WIDTH - 2 * margin - 20 : height - 2 * margin
  const across = orientation === 'right' ? height - 2 * margin : WIDTH - 2 * margin
  const position = (level: number, slot: number): Point => {
    const d =
      margin +
      (depth === 1 ? 0 : (along * level) / (depth - 1)) +
      (orientation === 'right' ? 10 : 0)
    const c = margin + (across * (slot + 0.5)) / leaves
    return orientation === 'right' ? [d, c] : [c, d]
  }

  const edges: Part[] = []
  const labels: Part[] = []
  const place = (node: TreeNode, level: number, firstSlot: number): Point => {
    const count = leavesOf(node)
    const at = position(level, firstSlot + (count - 1) / 2)
    let slot = firstSlot
    for (const child of node.children ?? []) {
      const childAt = place(child, level + 1, slot)
      slot += leavesOf(child)
      const start = level === 0 && hideRoot ? at : lerp(at, childAt, 0.2)
      const end = lerp(at, childAt, 0.8)
      edges.push(segment(start, end, { color: GREY, width: 1.75 }))
      if (child.edge) {
        labels.push(
          text(lerp(at, childAt, 0.5), child.edge, {
            size: 14,
            color: colorOf(child.edge),
            weight: 700,
          }),
        )
      }
    }
    if (!(level === 0 && hideRoot)) {
      labels.push(
        text(at, node.label, { color: node.highlight ? ACCENT : colorOf(node.label), weight: 700 }),
      )
    }
    return at
  }
  place(root, 0, 0)
  return drawing(height, ...edges, ...labels)
}

// ---------------------------------------------------------------------------
// Bande ou disque partagé en parts

export interface StripFigureOptions {
  /** Les groupes de parts égales, de gauche à droite, chacun avec sa couleur et son nom éventuel. */
  groups: readonly { parts: number; fill?: string; label?: string }[]
  /** Étiquette sous la bande, sur toute sa longueur (« 45 € »). */
  total?: string
  /** Largeur de la bande ; 280 par défaut. */
  width?: number
}

/** Bande partagée en parts égales : une fraction, un ratio, un partage. */
export function stripFigure(options: StripFigureOptions): Drawing {
  const { groups, total, width = 280 } = options
  const count = groups.reduce((sum, entry) => sum + entry.parts, 0)
  const partWidth = width / count
  const left = (WIDTH - width) / 2
  const top = groups.some((entry) => entry.label) ? 34 : 16
  const barHeight = 44
  const parts: Part[] = []
  let index = 0
  for (const { parts: size, fill = WHITE, label } of groups) {
    const start = left + index * partWidth
    for (let part = 0; part < size; part++) {
      parts.push(
        rect([start + part * partWidth, top], partWidth, barHeight, {
          fill,
          color: INK,
          width: 1.5,
        }),
      )
    }
    if (label) parts.push(text([start + (size * partWidth) / 2, top - 14], label, { weight: 700 }))
    index += size
  }
  parts.push(rect([left, top], width, barHeight, { color: INK, width: 2 }))
  let height = top + barHeight + 16
  if (total) {
    const y = top + barHeight + 12
    parts.push(
      arrow([left, y], [left + width, y], { both: true, color: GREY, width: 1.5, head: 7 }),
      text([WIDTH / 2, y], total, { weight: 700 }),
    )
    height = y + 20
  }
  return drawing(Math.max(height, 120), ...parts)
}

export interface DiscFigureOptions {
  /** Nombre de parts égales. */
  parts: number
  /** Les parts coloriées, en partant du haut, dans le sens des aiguilles d'une montre. */
  shaded: number
  fill?: string
  /** Rayon ; 70 par défaut. */
  radius?: number
  /** Texte à droite du disque (« 3/8 »). */
  label?: string
}

/** Disque partagé en parts égales, dont certaines sont coloriées. */
export function discFigure(options: DiscFigureOptions): Drawing {
  const { parts: count, shaded, fill = PASTEL.peche, radius = 70, label } = options
  const center: Point = [label ? WIDTH / 2 - 50 : WIDTH / 2, radius + 14]
  const step = 360 / count
  const parts: Part[] = [circle(center, radius, { fill: WHITE })]
  for (let part = 0; part < count; part++) {
    const from = 90 - (part + 1) * step
    const to = 90 - part * step
    parts.push(sector(center, radius, from, to, { fill: part < shaded ? fill : WHITE, width: 1.5 }))
  }
  parts.push(circle(center, radius))
  if (label)
    parts.push(text([center[0] + radius + 40, center[1]], label, { size: 20, weight: 700 }))
  return drawing(Math.max(2 * radius + 28, 120), ...parts)
}

/** Le point du bord d'un disque de `discFigure`, pour y accrocher une étiquette. */
export const discPoint = (center: Point, radius: number, degrees: number) =>
  polar(center, radius, degrees)

// ---------------------------------------------------------------------------
// Suite de boîtes reliées par des flèches

export interface ChainFigureOptions {
  /** Les contenus des boîtes, dans l'ordre : « x », « 5 », « ? ». */
  values: readonly string[]
  /** Les opérations écrites sur les flèches, une de moins que de boîtes : « × 3 », « + 4 ». */
  operations: readonly string[]
  /** Disposition : en ligne si elle tient, sinon de haut en bas. Automatique par défaut. */
  direction?: 'row' | 'column'
}

/** Programme de calcul, ou machine « x → f(x) » : des boîtes reliées par des flèches légendées. */
export function chainFigure(options: ChainFigureOptions): Drawing {
  const { values, operations } = options
  if (operations.length !== values.length - 1) {
    throw new Error('Une suite de boîtes a une opération de moins que de boîtes.')
  }
  const boxWidth = (value: string) => Math.max(44, textWidth(value, FONT_SIZE, 700) + 22)
  const arrowWidth = (operation: string) => Math.max(44, textWidth(operation, 14, 700) + 18)
  const rowWidth =
    values.reduce((total, value) => total + boxWidth(value), 0) +
    operations.reduce((total, operation) => total + arrowWidth(operation), 0)
  const direction = options.direction ?? (rowWidth <= WIDTH - 16 ? 'row' : 'column')
  const boxHeight = 38
  const boxStyle = (value: string) => ({
    fill: value === UNKNOWN ? WHITE : PASTEL.citron,
    color: value === UNKNOWN ? ACCENT : INK,
    width: 2,
    radius: 10,
  })
  const parts: Part[] = []

  if (direction === 'row') {
    let x = (WIDTH - rowWidth) / 2
    const y = 52
    values.forEach((value, index) => {
      const width = boxWidth(value)
      parts.push(
        rect([x, y], width, boxHeight, boxStyle(value)),
        text([x + width / 2, y + boxHeight / 2], value, {
          color: colorOf(value),
          weight: 700,
          halo: false,
        }),
      )
      x += width
      const operation = operations[index]
      if (operation !== undefined) {
        const room = arrowWidth(operation)
        parts.push(
          arrow([x + 4, y + boxHeight / 2], [x + room - 4, y + boxHeight / 2], {
            color: GREY,
            width: 1.75,
            head: 8,
          }),
          text([x + room / 2, y - 12], operation, { size: 14, weight: 700 }),
        )
        x += room
      }
    })
    return drawing(120, ...parts)
  }

  const gap = 34
  const height = values.length * boxHeight + operations.length * gap + 24
  let y = 12
  values.forEach((value, index) => {
    const width = Math.max(64, boxWidth(value))
    const x = WIDTH / 2 - 40 - width / 2
    parts.push(
      rect([x, y], width, boxHeight, boxStyle(value)),
      text([x + width / 2, y + boxHeight / 2], value, {
        color: colorOf(value),
        weight: 700,
        halo: false,
      }),
    )
    y += boxHeight
    const operation = operations[index]
    if (operation !== undefined) {
      const ax = WIDTH / 2 - 40
      parts.push(
        arrow([ax, y + 4], [ax, y + gap - 4], { color: GREY, width: 1.75, head: 8 }),
        text([ax + 14, y + gap / 2], operation, { size: 14, weight: 700, anchor: 'start' }),
      )
      y += gap
    }
  })
  return drawing(Math.max(height, 120), ...parts)
}
