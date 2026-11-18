import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AdjustBotRequest,
  AdminBot,
  AdminBotResponse,
  AdminBotsResponse,
  CreateBotRequest,
  UpdateBotRequest,
} from '../../../../shared/schemas/leaderboard'
import { api } from '../../../lib/api'
import { LIVE } from '../../../lib/freshness'

/** Bots, pour l'espace admin. */
const botsKey = ['admin', 'bots'] as const

export function useBots() {
  return useQuery({
    queryKey: botsKey,
    queryFn: async ({ signal }) =>
      (await api<AdminBotsResponse>('/api/admin/bots', { signal })).bots,
    ...LIVE,
  })
}

/** Après un changement sur un bot, la liste et le classement sont relus. */
function useBotCache() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: botsKey })
    void queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
  }
}

export function useCreateBot() {
  const refresh = useBotCache()
  return useMutation({
    mutationFn: (request: CreateBotRequest) =>
      api<AdminBotResponse>('/api/admin/bots', { method: 'POST', body: request }),
    onSuccess: refresh,
  })
}

export function useUpdateBot(id: string) {
  const refresh = useBotCache()
  return useMutation({
    mutationFn: (changes: UpdateBotRequest) =>
      api<AdminBotResponse>(`/api/admin/bots/${id}`, { method: 'PATCH', body: changes }),
    onSuccess: refresh,
  })
}

export function useAdjustBot(id: string) {
  const refresh = useBotCache()
  return useMutation({
    mutationFn: (change: Partial<AdjustBotRequest>) =>
      api<AdminBotResponse>(`/api/admin/bots/${id}/adjust`, { method: 'POST', body: change }),
    onSuccess: refresh,
  })
}

export function useDeleteBot(id: string) {
  const refresh = useBotCache()
  return useMutation({
    mutationFn: () => api<void>(`/api/admin/bots/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  })
}

export type { AdminBot }
