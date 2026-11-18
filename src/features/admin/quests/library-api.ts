import { useQuery } from '@tanstack/react-query'
import type { LibraryExerciseResponse, LibraryResponse } from '../../../../shared/schemas/library'
import { api } from '../../../lib/api'

/**
 * Bibliothèque d'exercices prêts à l'emploi. Son contenu fait partie de
 * l'application : il ne change pas tant que la page reste ouverte.
 */
const libraryKey = ['admin', 'library'] as const

export function useLibrary() {
  return useQuery({
    queryKey: libraryKey,
    queryFn: ({ signal }) => api<LibraryResponse>('/api/admin/library', { signal }),
    staleTime: Infinity,
  })
}

/** Un exercice complet, questions et corrections comprises ; rien n'est demandé sans identifiant. */
export function useLibraryExercise(id: string | null) {
  return useQuery({
    queryKey: [...libraryKey, id],
    queryFn: async ({ signal }) =>
      (
        await api<LibraryExerciseResponse>(`/api/admin/library/${encodeURIComponent(id ?? '')}`, {
          signal,
        })
      ).exercise,
    enabled: id !== null,
    staleTime: Infinity,
  })
}

/** Adresse d'une nouvelle quête pré-remplie avec un exercice de la bibliothèque. */
export const newQuestFromExercise = (exerciseId: string) =>
  `/admin/quetes/nouvelle?modele=${encodeURIComponent(exerciseId)}`
