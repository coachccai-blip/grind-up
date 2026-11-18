import { chainFigure, UNKNOWN } from './families.js'
import {
  ACCENT,
  arrow,
  brace,
  curvedArrow,
  curvedArrowTop,
  defineFigure,
  dot,
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
  shifted,
  text,
  textWidth,
  WHITE,
  withUnit,
} from './svg.js'

/**
 * Illustrations du thème « Équations ». Une figure par entrée, construite avec les
 * familles de families.ts ou les primitives de svg.ts : voir docs/bibliotheque.md,
 * « Illustrer un exercice ».
 */

/** Une étiquette dans une boîte arrondie, centrée sur `at`. */
function pill(
  at: Point,
  content: string,
  {
    fill = PASTEL.citron,
    color = INK,
    size = 15,
    minWidth = 0,
  }: { fill?: string; color?: string; size?: number; minWidth?: number } = {},
): Part {
  const width = Math.max(minWidth, textWidth(content, size, 700) + 18)
  const height = size + 14
  return [
    rect([at[0] - width / 2, at[1] - height / 2], width, height, {
      fill,
      color: color === ACCENT ? ACCENT : INK,
      width: 1.5,
      radius: 8,
    }),
    text(at, content, { size, weight: 700, color, halo: false }),
  ].join('')
}

// ---------------------------------------------------------------------------
// Équations du premier degré : la balance

/** Une balance à deux plateaux en équilibre, centrée en `cx`, chaque plateau portant son membre. */
function balance(cx: number, top: number, left: string, right: string): Part {
  const beamY = top + 50
  const reach = 34
  const plateY = beamY - 12
  const parts: Part[] = [
    // Pied et socle.
    segment([cx, beamY], [cx, beamY + 58], { width: 3 }),
    polygon(
      [
        [cx - 26, beamY + 70],
        [cx + 26, beamY + 70],
        [cx + 14, beamY + 58],
        [cx - 14, beamY + 58],
      ],
      { fill: PASTEL.lilas },
    ),
    // Fléau horizontal : l'équilibre.
    segment([cx - reach, beamY], [cx + reach, beamY], { width: 3 }),
    dot([cx, beamY], { radius: 4.5 }),
  ]
  for (const [side, label] of [
    [-1, left],
    [1, right],
  ] as const) {
    const x = cx + side * reach
    parts.push(
      segment([x, beamY], [x, plateY]),
      segment([x - 26, plateY], [x + 26, plateY], { width: 3 }),
      pill([x, plateY - 17], label, { fill: side < 0 ? PASTEL.peche : PASTEL.ciel }),
    )
  }
  return parts.join('')
}

const balanceFigure = defineFigure(
  'equations-balance',
  drawing(
    196,
    balance(78, 10, '3x − 5', '13'),
    balance(242, 10, '3x', '18'),
    arrow([144, 96], [176, 96], { color: ACCENT, width: 2, head: 8 }),
    text([160, 78], '+ 5', { weight: 700, color: ACCENT }),
    text([78, 150], '3x − 5 = 13', { size: 14, weight: 700, color: GREY }),
    text([242, 150], '3x = 18', { size: 14, weight: 700, color: GREY }),
    text([160, 182], 'on ajoute 5 sur chaque plateau', { size: 14, weight: 700, color: ACCENT }),
  ),
)

// ---------------------------------------------------------------------------
// Équations produit nul

/** A × B = 0, donc A = 0 ou B = 0 : chaque facteur garde sa couleur. */
function produitNul() {
  const factor = (at: Point, name: string, fill: string) =>
    pill(at, name, { fill, minWidth: 40, size: 17 })
  const sign = (at: Point, content: string, color = INK) =>
    text(at, content, { size: 17, weight: 700, color })
  return drawing(
    196,
    factor([108, 34], 'A', PASTEL.peche),
    sign([140, 34], '×'),
    factor([172, 34], 'B', PASTEL.ciel),
    sign([216, 34], '= 0'),
    arrow([140, 58], [90, 108], { color: GREY, width: 1.75, head: 8 }),
    arrow([180, 58], [230, 108], { color: GREY, width: 1.75, head: 8 }),
    factor([60, 132], 'A', PASTEL.peche),
    sign([102, 132], '= 0'),
    text([160, 132], 'ou', { size: 17, weight: 700, color: ACCENT }),
    factor([220, 132], 'B', PASTEL.ciel),
    sign([262, 132], '= 0'),
    text([160, 178], 'un produit nul : l’un des facteurs est nul', {
      size: 14,
      color: GREY,
    }),
  )
}

const produitNulFigure = defineFigure('equations-produit-nul-schema', produitNul())

/** x² = 9 : les deux solutions 3 et −3, à égale distance de 0 sur la droite graduée. */
function carreDroite() {
  const unit = 34
  const zero = 160
  const y = 92
  const at = (value: number): Point => [zero + value * unit, y]
  const parts: Part[] = [arrow([14, y], [306, y], { width: 1.75, head: 8 })]
  for (let value = -4; value <= 4; value++) {
    parts.push(segment([at(value)[0], y - 5], [at(value)[0], y + 5], { width: 1.5 }))
    if (value !== 3 && value !== -3) {
      parts.push(
        text([at(value)[0], y + 18], value < 0 ? `−${-value}` : String(value), {
          size: 13,
          color: GREY,
        }),
      )
    }
  }
  parts.push(
    brace(at(-3), at(0), '3 unités', { outside: [zero, y + 40], offset: 8 }),
    brace(at(0), at(3), '3 unités', { outside: [zero, y + 40], offset: 8 }),
    dot(at(-3), { color: ACCENT, radius: 5 }),
    dot(at(3), { color: ACCENT, radius: 5 }),
    text([at(-3)[0], y + 20], '−3', { size: 17, weight: 700, color: ACCENT }),
    text([at(3)[0], y + 20], '3', { size: 17, weight: 700, color: ACCENT }),
    text([at(-3)[0], y + 48], '(−3)² = 9', { weight: 700 }),
    text([at(3)[0], y + 48], '3² = 9', { weight: 700 }),
  )
  return drawing(160, ...parts)
}

const carreDroiteFigure = defineFigure('equations-carre-deux-solutions', carreDroite())

// ---------------------------------------------------------------------------
// Problèmes mis en équation

/** Le cinéma de l'exemple : 2 places adulte, 3 places enfant, 43 € en tout. */
function cinema() {
  const ticket = (x: number, label: string, fill: string): Part =>
    [
      rect([x, 30], 54, 40, { fill, width: 1.5, radius: 6 }),
      text([x + 27, 50], label, { size: 13, weight: 700, halo: false }),
    ].join('')
  const xs = [13, 72, 131, 190, 249]
  return drawing(
    152,
    ...xs.map((x, index) =>
      index < 2 ? ticket(x, 'adulte', PASTEL.lilas) : ticket(x, 'enfant', PASTEL.menthe),
    ),
    brace([13, 70], [303, 70], `${withUnit(43, '€')} en tout`, { outside: [160, 30] }),
    text([90, 132], 'enfant : ?', { weight: 700, color: ACCENT }),
    text([226, 132], `adulte : ${withUnit(4, '€')} de plus`, { weight: 700 }),
  )
}

const cinemaFigure = defineFigure('problemes-exemple-cinema', cinema())

/** Trois nombres entiers consécutifs, de somme 114 ; le plus petit est cherché. */
function consecutifs() {
  const y = 46
  const width = 62
  const xs = [26, 129, 232]
  const parts: Part[] = xs.map((x, index) =>
    rect([x, y], width, 42, {
      fill: index === 0 ? WHITE : PASTEL.citron,
      color: index === 0 ? ACCENT : INK,
      radius: 10,
    }),
  )
  parts.push(text([xs[0]! + width / 2, y + 21], UNKNOWN, { size: 18, weight: 700, color: ACCENT }))
  for (const x of [xs[0]!, xs[1]!]) {
    parts.push(
      curvedArrow([x + width - 6, y - 4], [x + 103 + 6, y - 4], 10, { color: GREY, width: 1.75 }),
      text([curvedArrowTop([x + width, y - 4], [x + 103, y - 4], 10)[0], y - 26], '+ 1', {
        size: 14,
        weight: 700,
      }),
    )
  }
  parts.push(
    text([xs[0]! + width / 2, y + 58], 'le plus petit', { size: 13, color: GREY }),
    brace([26, y + 72], [294, y + 72], 'somme : 114', { outside: [160, y] }),
  )
  return drawing(168, ...parts)
}

const consecutifsFigure = defineFigure('problemes-nombres-consecutifs', consecutifs())

/** Le rectangle : la longueur dépasse la largeur de 7 cm ; périmètre 54 cm ; longueur cherchée. */
function rectangle() {
  const left = 76
  const top = 44
  const tall = 96
  const extra = 74
  const long = tall + 10 + extra
  const right = left + long
  const bottom = top + tall
  return drawing(
    196,
    rect([left, top], long, tall, { fill: PASTEL.lilas }),
    segment([left + tall + 10, bottom - 8], [left + tall + 10, bottom + 8], {
      color: GREY,
      width: 1.5,
    }),
    text([left + long / 2, 22], 'longueur : ?', { weight: 700, color: ACCENT }),
    text([left - 10, top + tall / 2], 'largeur', { weight: 700, color: GREY, anchor: 'end' }),
    text([left + long / 2, top + tall / 2], `périmètre : ${withUnit(54, 'cm')}`, {
      weight: 700,
      halo: false,
    }),
    brace([left, bottom], [left + tall + 10, bottom], 'largeur', {
      outside: [left, top],
    }),
    brace([left + tall + 10, bottom], [right, bottom], withUnit(7, 'cm'), {
      outside: [left, top],
    }),
  )
}

const rectangleFigure = defineFigure('problemes-rectangle-perimetre', rectangle())

/** Les deux tarifs de la salle d'escalade, sur deux cartes. */
function tarifs() {
  const card = (x: number, title: string, lines: readonly string[], fill: string): Part =>
    [
      rect([x, 14], 140, 108, { fill, radius: 12 }),
      text([x + 70, 36], title, { size: 17, weight: 700, halo: false }),
      segment([x + 16, 52], [x + 124, 52], { color: GREY, width: 1.5 }),
      ...lines.map((line, index) =>
        text([x + 70, 72 + index * 24], line, { size: 14, weight: 700, halo: false }),
      ),
    ].join('')
  return drawing(
    166,
    card(14, 'Tarif A', [`${withUnit(11, '€')} la séance`], PASTEL.peche),
    card(
      166,
      'Tarif B',
      [`${withUnit(60, '€')} par an`, `+ ${withUnit(6, '€')} la séance`],
      PASTEL.menthe,
    ),
    text([160, 146], 'même prix pour ? séances', { weight: 700, color: ACCENT }),
  )
}

const tarifsFigure = defineFigure('problemes-deux-tarifs', tarifs())

/** Le partage de 150 € : des barres, la part d'Anaïs servant d'unité. */
function partage() {
  const left = 80
  const part = 62
  const bonus = 42
  const rows = [46, 90, 134]
  const block = (x: number, y: number, width: number, fill: string, label?: string): Part =>
    [
      rect([x, y - 15], width, 30, { fill, width: 1.5 }),
      label && text([x + width / 2, y], label, { size: 13, weight: 700, halo: false }),
    ].join('')
  const name = (y: number, content: string) =>
    text([left - 10, y], content, { weight: 700, anchor: 'end' })
  return drawing(
    176,
    name(rows[0]!, 'Anaïs'),
    block(left, rows[0]!, part, PASTEL.peche),
    name(rows[1]!, 'Bilal'),
    block(left, rows[1]!, part, PASTEL.peche),
    block(left + part, rows[1]!, bonus, PASTEL.ciel, withUnit(10, '€')),
    name(rows[2]!, 'Chloé'),
    block(left, rows[2]!, part, PASTEL.peche),
    block(left + part, rows[2]!, part, PASTEL.peche),
    text([left + 2 * part + 18, rows[2]!], UNKNOWN, { size: 18, weight: 700, color: ACCENT }),
    brace([238, rows[0]! - 15], [238, rows[2]! + 15], withUnit(150, '€'), {
      outside: [100, 90],
    }),
    text([160, 164], 'Schéma, pas à l’échelle', { size: 13, color: GREY }),
  )
}

const partageFigure = defineFigure('problemes-partage', partage())

/** Les programmes A et B appliqués au même nombre de départ. */
function deuxProgrammes() {
  const a = chainFigure({ values: [UNKNOWN, '…', 'A'], operations: ['× 5', '− 3'] })
  const b = chainFigure({ values: [UNKNOWN, '…', 'B'], operations: ['+ 6', '× 2'] })
  return drawing(
    250,
    text([14, 18], 'Programme A', { size: 14, weight: 700, color: GREY, anchor: 'start' }),
    shifted(a, -24, 12),
    text([14, 126], 'Programme B', { size: 14, weight: 700, color: GREY, anchor: 'start' }),
    shifted(b, -24, 120),
    text([290, 126], 'A = B', { size: 15, weight: 700, color: ACCENT }),
    text([160, 236], 'même nombre de départ : ?', { size: 14, weight: 700, color: ACCENT }),
  )
}

const deuxProgrammesFigure = defineFigure('problemes-deux-programmes', deuxProgrammes())

/** La frise des âges : aujourd'hui, puis dans ? ans. */
function ages() {
  const now = 128
  const later = 252
  const axis = 132
  const cell = (x: number, y: number, content: string, color = INK) =>
    text([x, y], content, { weight: 700, color })
  return drawing(
    196,
    text([14, 40], 'Nadia', { weight: 700, anchor: 'start' }),
    text([14, 82], 'sa mère', { weight: 700, anchor: 'start' }),
    pill([now, 40], withUnit(12, 'ans'), { fill: PASTEL.menthe, minWidth: 70 }),
    pill([now, 82], withUnit(40, 'ans'), { fill: PASTEL.peche, minWidth: 70 }),
    cell(later, 40, '…', GREY),
    pill([later, 82], 'le double', { fill: WHITE, color: ACCENT, size: 14 }),
    text([later, 104], 'de l’âge de Nadia', { size: 13, color: GREY }),
    arrow([20, axis], [306, axis], { color: GREY, width: 1.75, head: 8 }),
    dot([now, axis]),
    dot([later, axis]),
    text([now, axis + 20], 'aujourd’hui', { size: 14 }),
    text([later, axis + 20], 'plus tard', { size: 14 }),
    curvedArrow([now + 6, axis + 34], [later - 6, axis + 34], -10, { color: ACCENT, width: 1.75 }),
    text([(now + later) / 2, axis + 56], '+ ? ans', { weight: 700, color: ACCENT }),
  )
}

const agesFigure = defineFigure('problemes-ages-frise', ages())

export const equationsFigures: readonly FigureDefinition[] = [
  balanceFigure,
  produitNulFigure,
  carreDroiteFigure,
  cinemaFigure,
  consecutifsFigure,
  rectangleFigure,
  tarifsFigure,
  partageFigure,
  deuxProgrammesFigure,
  agesFigure,
]
