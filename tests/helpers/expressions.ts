/**
 * Petit évaluateur des calculs tels qu'ils sont écrits dans les exercices : des
 * nombres (avec leurs espaces de milliers), la lettre x, « + », « − », « × », des
 * parenthèses, le carré « ² », et la multiplication sous-entendue : 3x,
 * 2(x + 1), (x + 1)(x − 1).
 *
 * Il sert à recalculer les énoncés, les réponses et les corrections de la
 * bibliothèque : une erreur de signe ou de coefficient fait échouer un test.
 */
type Token =
  { kind: 'number'; value: number } | { kind: 'x' | '+' | '-' | '*' | '(' | ')' | 'square' }

const SYMBOLS: Record<string, Exclude<Token['kind'], 'number'>> = {
  x: 'x',
  '+': '+',
  '−': '-',
  '-': '-',
  '×': '*',
  '(': '(',
  ')': ')',
  '²': 'square',
}

function tokenize(text: string): Token[] | null {
  // Toutes les espaces sont retirées, insécables et fines comprises : « 10 000 » est un nombre.
  const compact = text.replace(/\s+/g, '')
  const tokens: Token[] = []
  let position = 0
  while (position < compact.length) {
    const number = /^\d+(?:,\d+)?/.exec(compact.slice(position))
    if (number) {
      tokens.push({ kind: 'number', value: Number(number[0].replace(',', '.')) })
      position += number[0].length
      continue
    }
    const kind = SYMBOLS[compact[position]!]
    if (!kind) return null
    tokens.push({ kind })
    position += 1
  }
  return tokens
}

/**
 * Valeur d'une expression pour un x donné, ou null si le texte n'est pas une
 * expression en x (une phrase, une lettre a ou b, un signe égal…).
 */
export function evaluate(text: string, x: number): number | null {
  const tokens = tokenize(text)
  if (!tokens || tokens.length === 0) return null
  let position = 0
  const peek = () => tokens[position]?.kind
  const fail = (): never => {
    throw new SyntaxError(text)
  }

  const atom = (): number => {
    const token = tokens[position] ?? fail()
    position += 1
    let value: number
    if (token.kind === 'number') {
      value = token.value
    } else if (token.kind === 'x') {
      value = x
    } else if (token.kind === '(') {
      value = sum()
      if (peek() !== ')') fail()
      position += 1
    } else {
      return fail()
    }
    while (peek() === 'square') {
      position += 1
      value *= value
    }
    return value
  }

  const product = (): number => {
    let value = atom()
    for (;;) {
      if (peek() === '*') {
        position += 1
        value *= atom()
      } else if (peek() === 'x' || peek() === '(') {
        // Multiplication sous-entendue : 3x, 2(x + 1), (x + 1)(x − 1).
        value *= atom()
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
    return position === tokens.length ? value : null
  } catch {
    return null
  }
}

/** Valeurs d'essai : assez nombreuses pour distinguer deux polynômes du second degré. */
const SAMPLES = [-7, -3, -1, 0, 1, 2, 5, 11]

/**
 * Vrai si les deux textes sont des expressions égales pour toute valeur de x.
 * Null si l'un des deux n'est pas une expression.
 */
export function sameExpression(first: string, second: string): boolean | null {
  let same = true
  for (const x of SAMPLES) {
    const a = evaluate(first, x)
    const b = evaluate(second, x)
    if (a === null || b === null) return null
    if (Math.abs(a - b) > 1e-9) same = false
  }
  return same
}
