import { useQuery } from '@tanstack/react-query'
import type { AdminOverviewResponse } from '../../../shared/schemas/admin'
import { api } from '../../lib/api'
import { LIVE } from '../../lib/freshness'

/** Vue d'ensemble de l'admin : ce qui demande son attention, relu à chaque visite. */
export function useOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'] as const,
    queryFn: async ({ signal }) =>
      (await api<AdminOverviewResponse>('/api/admin/overview', { signal })).overview,
    ...LIVE,
  })
}
