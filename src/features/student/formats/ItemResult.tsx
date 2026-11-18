import { Chip } from '../../../ui/Chip'

/** Verdict d'une question après correction : le libellé dit tout, la couleur l'appuie. */
export function ItemResult({ right }: { right: boolean | undefined }) {
  if (right === undefined) return null
  return right ? <Chip tone="success">Juste</Chip> : <Chip tone="urgent">À revoir</Chip>
}
