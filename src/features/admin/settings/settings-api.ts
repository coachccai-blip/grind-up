import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { GameSettings } from '../../../../shared/rules/settings'
import type {
  AdminSettingsResponse,
  UpdateSettingsRequest,
} from '../../../../shared/schemas/settings'
import { api } from '../../../lib/api'

/** Paramètres de l'admin : barème d'XP, bonus, valeurs des nouvelles quêtes, étiquette « Bot ». */
const settingsKey = ['admin', 'settings'] as const

export function useSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: async ({ signal }) =>
      (await api<AdminSettingsResponse>('/api/admin/settings', { signal })).settings,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (changes: UpdateSettingsRequest) =>
      api<AdminSettingsResponse>('/api/admin/settings', { method: 'PATCH', body: changes }),
    onSuccess: ({ settings }) => {
      queryClient.setQueryData(settingsKey, settings)
      // L'étiquette « Bot » change ce que montre le classement.
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}

/**
 * Part de sa récompense que garde une quête rendue en retard, en points de
 * pourcentage ; null tant que les paramètres ne sont pas chargés.
 */
export function useLatePercent(): number | null {
  return useSettings().data?.latePercent ?? null
}

export type { GameSettings }
