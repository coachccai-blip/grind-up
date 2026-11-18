/** Thèmes de la bibliothèque, dans l'ordre où l'admin les parcourt. */
export const LIBRARY_THEMES = [
  { id: 'nombres', label: 'Nombres et calculs' },
  { id: 'calcul-litteral', label: 'Calcul littéral' },
  { id: 'equations', label: 'Équations' },
  { id: 'fonctions', label: 'Fonctions' },
  { id: 'proportionnalite', label: 'Proportionnalité et pourcentages' },
  { id: 'donnees', label: 'Statistiques et probabilités' },
  { id: 'geometrie', label: 'Géométrie plane' },
  { id: 'espace', label: 'Espace et grandeurs' },
  { id: 'algorithmique', label: 'Algorithmique' },
] as const

export type LibraryThemeId = (typeof LIBRARY_THEMES)[number]['id']
