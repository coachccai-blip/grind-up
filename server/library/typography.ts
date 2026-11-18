/**
 * Typographie des exercices de la bibliothèque. Un exercice se rédige au
 * clavier, avec des espaces ordinaires ; cette mise en forme lui donne la
 * typographie de l'application, celle que suivent tous ses écrans.
 */

/** Unités qui ne se séparent pas du nombre qui les précède. */
const UNITS =
  'km/h|m/s|cm[²³]?|mm[²³]?|dm[²³]?|km[²³]?|m[²³]?|kg|mg|g|cL|mL|dL|hL|L|min|h|s|€|%|°C|°'

const NBSP = '\u00A0'
const NARROW_NBSP = '\u202F'

export function typography(text: string): string {
  return (
    text
      // Apostrophe typographique.
      .replace(/(\p{L})'(?=\p{L})/gu, '$1’')
      // Signe moins des calculs : entre deux termes, ou devant un nombre. Un tiret
      // en début de ligne suivi d'une espace ouvre une liste : il reste un tiret.
      .replace(/(?<=\S) - (?=\S)/g, ' − ')
      .replace(/(?<=^|[\s(=×÷])-(?=[\dx(√π])/gm, '−')
      // Espace insécable devant les signes doubles et à l'intérieur des guillemets.
      .replace(/ (?=[:;!?](?:\s|$|\*))/g, NBSP)
      .replace(/« /g, `«${NBSP}`)
      .replace(/ »/g, `${NBSP}»`)
      // Un nombre et son unité ne se séparent pas ; le signe « % » ne se sépare de rien.
      .replace(new RegExp(`([\\dπ]) (?=(?:${UNITS})(?![\\p{L}\\p{N}]))`, 'gu'), `$1${NBSP}`)
      .replace(/ (?=%)/g, NBSP)
      // Une flèche reste attachée à ce qu'elle relie : « 3 → −1 », « x ↦ 2x ».
      .replace(/ ([→↦]) /g, `${NBSP}$1${NBSP}`)
      // Séparateur de milliers : une espace fine insécable.
      .replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NARROW_NBSP}`)
      // Une parenthèse courte d'un calcul reste sur une seule ligne : « (x − 4) » ne se coupe pas.
      .replace(/\([^()\n]{1,18}\)/g, (group) => group.replaceAll(' ', NBSP))
  )
}
