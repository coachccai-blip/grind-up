/**
 * Variante de sql.js dont le moteur SQLite (WebAssembly) est embarqué dans le
 * fichier JavaScript : aucun fichier .wasm à retrouver à l'exécution.
 */
declare module 'sql.js/dist/sql-wasm-inline.js' {
  import type initSqlJs from 'sql.js'

  const init: typeof initSqlJs
  export default init
}
