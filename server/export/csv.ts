import { instantToParisLocal } from '../../shared/time.js'

/**
 * Fichiers CSV pour un tableur réglé en français : séparateur point-virgule,
 * UTF-8 avec sa marque d'en-tête (Excel reconnaît alors les accents), fins de
 * ligne Windows, dates à l'heure de Paris.
 */
export type CsvCell = string | number | null

export interface CsvTable {
  header: string[]
  rows: CsvCell[][]
}

/** Marque d'ordre des octets : sans elle, Excel lit le fichier dans un autre encodage. */
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff)

/**
 * Un texte qui commence par « = », « + », « - » ou « @ » serait pris pour une
 * formule par le tableur : une apostrophe en tête le garde comme du texte. Les
 * pseudos, les titres et les commentaires sont saisis par des utilisateurs.
 */
function neutralize(text: string): string {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
}

function cell(value: CsvCell): string {
  if (value === null) return ''
  // Un nombre reste un nombre, signe compris : le tableur peut le sommer.
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : ''
  return `"${neutralize(value).replaceAll('"', '""')}"`
}

export function toCsv({ header, rows }: CsvTable): string {
  const lines = [header, ...rows].map((row) => row.map(cell).join(';'))
  return `${BYTE_ORDER_MARK}${lines.join('\r\n')}\r\n`
}

/** « 18/11/2026 10:30 », heure de Paris : un format que le tableur reconnaît comme une date. */
export function csvDate(iso: string | null): string | null {
  if (!iso) return null
  const local = instantToParisLocal(new Date(iso))
  const [date, time] = local.split('T') as [string, string]
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year} ${time}`
}
