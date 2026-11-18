/**
 * Thèmes de la bibliothèque, dans l'ordre où l'admin les parcourt. Chacun a son
 * emoji, comme les catégories et les difficultés des quêtes.
 */
export const LIBRARY_THEMES = [
  { id: 'nombres', label: 'Nombres et calculs', emoji: '🔢' },
  { id: 'calcul-litteral', label: 'Calcul littéral', emoji: '🔤' },
  { id: 'equations', label: 'Équations', emoji: '⚖️' },
  { id: 'fonctions', label: 'Fonctions', emoji: '📈' },
  { id: 'proportionnalite', label: 'Proportionnalité et pourcentages', emoji: '🛒' },
  { id: 'donnees', label: 'Statistiques et probabilités', emoji: '🎲' },
  { id: 'geometrie', label: 'Géométrie plane', emoji: '📐' },
  { id: 'espace', label: 'Espace et grandeurs', emoji: '🧊' },
  { id: 'algorithmique', label: 'Algorithmique', emoji: '🤖' },
] as const

export type LibraryThemeId = (typeof LIBRARY_THEMES)[number]['id']
