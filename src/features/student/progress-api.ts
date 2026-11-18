import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SessionResponse } from '../../../shared/schemas/auth'
import type { JournalResponse, ProgressResponse } from '../../../shared/schemas/progress'
import { sessionQueryKey } from '../../app/session'
import { api } from '../../lib/api'
import { LIVE } from '../../lib/freshness'

/** Progression de l'élève connecté : XP, niveau, série, badges, journal. */
export const progressKey = ['student', 'progress'] as const
const journalKey = ['student', 'journal'] as const

export function useProgress() {
  return useQuery({
    queryKey: progressKey,
    queryFn: async ({ signal }) =>
      (await api<ProgressResponse>('/api/progress', { signal })).progress,
    ...LIVE,
  })
}

export function useJournal(enabled: boolean) {
  return useQuery({
    queryKey: journalKey,
    queryFn: async ({ signal }) =>
      (await api<JournalResponse>('/api/progress/journal', { signal })).entries,
    enabled,
    ...LIVE,
  })
}

/** L'élève a vu l'annonce de ses validations et de ses badges. */
export function useMarkCelebrated() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api<ProgressResponse>('/api/progress/celebration/seen', { method: 'POST', body: {} }),
    onSuccess: ({ progress }) => queryClient.setQueryData(progressKey, progress),
  })
}

export function useChangeAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (avatar: string) =>
      api<SessionResponse>('/api/account/avatar', { method: 'PATCH', body: { avatar } }),
    onSuccess: (session) => queryClient.setQueryData(sessionQueryKey, session),
  })
}
