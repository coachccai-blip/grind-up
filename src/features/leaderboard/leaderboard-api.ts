import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { LeaderboardPeriod, LeaderboardSort } from '../../../shared/rules/leaderboard'
import type { LeaderboardResponse } from '../../../shared/schemas/leaderboard'
import { api } from '../../lib/api'
import { LIVE } from '../../lib/freshness'

/** Classement d'une période, relu à chaque ouverture : c'est aussi ce qui fait avancer les bots. */
export function useLeaderboard(period: LeaderboardPeriod, sort: LeaderboardSort) {
  return useQuery({
    queryKey: ['leaderboard', period, sort] as const,
    queryFn: async ({ signal }) =>
      (
        await api<LeaderboardResponse>(`/api/leaderboard?period=${period}&sort=${sort}`, {
          signal,
        })
      ).entries,
    // Changer de période ou de tri garde l'ancien classement à l'écran le temps de charger le
    // nouveau : la page ne se vide pas, et ne remonte pas.
    placeholderData: keepPreviousData,
    ...LIVE,
  })
}
