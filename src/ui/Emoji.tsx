/**
 * Emoji décoratif : il accompagne toujours un libellé et reste masqué aux
 * lecteurs d'écran (section 8 du brief).
 */
export function Emoji({ symbol, className }: { symbol: string; className?: string }) {
  return (
    <span aria-hidden="true" className={className}>
      {symbol}
    </span>
  )
}
