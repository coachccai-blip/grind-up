/**
 * Petit évaluateur des calculs tels qu'ils sont écrits dans les exercices :
 *
 * - des nombres, avec leur virgule et leurs espaces de milliers ;
 * - la lettre x, le nombre π ;
 * - « + », « − », « × », « ÷ », la barre de fraction « / », des parenthèses ;
 * - les puissances écrites en exposant (x², 10³, 10⁻³), la racine carrée « √ » ;
 * - le pourcentage « % », le degré « ° » ;
 * - cos, sin, tan en degrés, et leurs réciproques arccos, arcsin, arctan ;
 * - la multiplication sous-entendue : 3x, 2(x + 1), (x + 1)(x − 1), 2√3, 2π.
 *
 * Il sert à recalculer les énoncés, les réponses et les corrections de la
 * bibliothèque : une erreur de signe ou de coefficient fait échouer un test.
 */
const FUNCTIONS = ['arccos', 'arcsin', 'arctan', 'cos', 'sin', 'tan'] as const
type FunctionName = (typeof FUNCTIONS)[number]

type Token =
  | { kind: 'number'; value: number }
  | { kind: 'power'; value: number }
  | { kind: 'function'; name: FunctionName }
  | { kind: 'x' | 'pi' | '+' | '-' | '*' | '/' | '(' | ')' | 'root' | 'percent' | 'degree' }

const SYMBOLS: Record<string, Exclude<Token['kind'], 'number' | 'power' | 'function'>> = {
  x: 'x',
  π: 'pi',
  '+': '+',
  '−': '-',
  '-': '-',
  '×': '*',
  '÷': '/',
  '/': '/',
  '(': '(',
  ')': ')',
  '√': 'root',
  '%': 'percent',
  '°': 'degree',
}

const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹'

function tokenize(text: string): Token[] | null {
  // Toutes les espaces sont retirées, insécables et fines comprises : « 10 000 » est un nombre.
  const compact = text.replace(/\s+/g, '')
  const tokens: Token[] = []
  let position = 0
  while (position < compact.length) {
    const rest = compact.slice(position)
    const number = /^\d+(?:,\d+)?/.exec(rest)
    if (number) {
      tokens.push({ kind: 'number', value: Number(number[0].replace(',', '.')) })
      position += number[0].length
      continue
    }
    const power = /^⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+/.exec(rest)
    if (power) {
      const digits = [...power[0].replace('⁻', '')]
        .map((digit) => SUPERSCRIPT_DIGITS.indexOf(digit))
        .join('')
      tokens.push({ kind: 'power', value: Number(digits) * (power[0].startsWith('⁻') ? -1 : 1) })
      position += power[0].length
      continue
    }
    const name = FUNCTIONS.find((candidate) => rest.startsWith(candidate))
    if (name) {
      tokens.push({ kind: 'function', name })
      position += name.length
      continue
    }
    const kind = SYMBOLS[compact[position]!]
    if (!kind) return null
    tokens.push({ kind })
    position += 1
  }
  return tokens
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const toDegrees = (radians: number) => (radians * 180) / Math.PI

function applyFunction(name: FunctionName, value: number): number {
  switch (name) {
    case 'cos':
      return Math.cos(toRadians(value))
    case 'sin':
      return Math.sin(toRadians(value))
    case 'tan':
      return Math.tan(toRadians(value))
    case 'arccos':
      return toDegrees(Math.acos(value))
    case 'arcsin':
      return toDegrees(Math.asin(value))
    case 'arctan':
      return toDegrees(Math.atan(value))
  }
}

/**
 * Valeur d'une expression pour un x donné, ou null si le texte n'est pas une
 * expression (une phrase, une lettre a ou b, un signe égal, une unité…).
 */
export function evaluate(text: string, x: number): number | null {
  const read = tokenize(text)
  if (!read || read.length === 0) return null
  const tokens: readonly Token[] = read
  let position = 0
  const peek = () => tokens[position]?.kind
  const fail = (): never => {
    throw new SyntaxError(text)
  }

  /** Un nombre, x, π, une parenthèse, une racine ou une fonction, sans ses exposants. */
  const base = (): number => {
    const token = tokens[position] ?? fail()
    position += 1
    switch (token.kind) {
      case 'number': {
        // Deux entiers séparés par une barre forment une fraction : 3/4 ÷ 2/5 se lit (3/4) ÷ (2/5).
        const next = tokens[position + 1]
        if (peek() === '/' && next?.kind === 'number' && tokens[position + 2]?.kind !== 'power') {
          position += 2
          return token.value / next.value
        }
        return token.value
      }
      case 'x':
        return x
      case 'pi':
        return Math.PI
      case '(': {
        const value = sum()
        if (peek() !== ')') fail()
        position += 1
        return value
      }
      case 'root':
        return Math.sqrt(factor())
      case 'function':
        return applyFunction(token.name, factor())
      default:
        return fail()
    }
  }

  /** Une base suivie de ses exposants, de « % » ou de « ° ». */
  function factor(): number {
    let value = base()
    for (;;) {
      const token = tokens[position]
      if (token?.kind === 'power') {
        value = value ** token.value
      } else if (token?.kind === 'percent') {
        value /= 100
      } else if (token?.kind !== 'degree') {
        return value
      }
      position += 1
    }
  }

  /** Après un signe « × » ou « ÷ », un facteur peut porter son signe : 2 × −3. */
  const signedFactor = (): number => {
    if (peek() !== '-') return factor()
    position += 1
    return -factor()
  }

  const product = (): number => {
    let value = factor()
    for (;;) {
      const next = peek()
      if (next === '*') {
        position += 1
        value *= signedFactor()
      } else if (next === '/') {
        position += 1
        value /= signedFactor()
      } else if (
        next === 'x' ||
        next === 'pi' ||
        next === '(' ||
        next === 'root' ||
        next === 'function'
      ) {
        // Multiplication sous-entendue : 3x, 2(x + 1), (x + 1)(x − 1), 2√3, 2π.
        value *= factor()
      } else {
        return value
      }
    }
  }

  function sum(): number {
    // Un signe moins en tête porte sur tout le premier terme : −x² vaut −(x²).
    const negative = peek() === '-'
    if (negative) position += 1
    let value = negative ? -product() : product()
    for (;;) {
      if (peek() === '+') {
        position += 1
        value += product()
      } else if (peek() === '-') {
        position += 1
        value -= product()
      } else {
        return value
      }
    }
  }

  try {
    const value = sum()
    return position === tokens.length && Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

/** Valeurs d'essai : assez nombreuses pour distinguer deux expressions du second degré. */
const SAMPLES = [-7, -3, -1, 0.5, 1, 2, 5, 11]

const close = (a: number, b: number) =>
  Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))

/**
 * Vrai si les deux textes sont des expressions égales pour toute valeur de x.
 * Null si l'un des deux n'est pas une expression.
 */
export function sameExpression(first: string, second: string): boolean | null {
  let same = true
  let compared = 0
  for (const x of SAMPLES) {
    const a = evaluate(first, x)
    const b = evaluate(second, x)
    // Une valeur d'essai peut sortir du domaine d'un calcul (une racine, un quotient) : elle est passée.
    if (a === null || b === null) continue
    compared += 1
    if (!close(a, b)) same = false
  }
  return compared === 0 ? null : same
}

/**
 * Vrai si `rounded` est bien une valeur approchée de `exact` : l'écart ne
 * dépasse pas une demi-unité du dernier chiffre écrit. Null si l'un des deux
 * textes n'est pas un calcul.
 */
export function roundsTo(exact: string, rounded: string): boolean | null {
  const value = evaluate(exact, 1)
  const approximation = evaluate(rounded, 1)
  if (value === null || approximation === null) return null
  const plain = /^[−-]?\d+(?:,(\d+))?[°%]?$/.exec(rounded.replace(/\s+/g, ''))
  // Un arrondi écrit autrement qu'un simple nombre (3,2 × 10⁵) est comparé à 1 % près.
  const tolerance = plain
    ? 0.5 * 10 ** -(plain[1]?.length ?? 0) * (rounded.includes('%') ? 0.01 : 1)
    : 0.01 * Math.abs(value)
  return Math.abs(value - approximation) <= tolerance * (1 + 1e-9)
}
