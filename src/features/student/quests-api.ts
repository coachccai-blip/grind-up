import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AttemptRequest,
  StudentQuestDetail,
  StudentQuestResponse,
  StudentQuestsResponse,
} from '../../../shared/schemas/quests'
import { api } from '../../lib/api'
import { LIVE } from '../../lib/freshness'
import { progressKey } from './progress-api'

/** Quêtes de l'élève connecté. */
const questsKey = ['student', 'quests'] as const
const questKey = (id: string) => ['student', 'quest', id] as const

export function useMyQuests() {
  return useQuery({
    queryKey: questsKey,
    queryFn: async ({ signal }) =>
      (await api<StudentQuestsResponse>('/api/quests', { signal })).quests,
    ...LIVE,
  })
}

export function useMyQuest(id: string) {
  return useQuery({
    queryKey: questKey(id),
    queryFn: async ({ signal }) =>
      (await api<StudentQuestResponse>(`/api/quests/${id}`, { signal })).quest,
    ...LIVE,
  })
}

/** Range la quête renvoyée par le serveur, et fait relire les listes et la progression. */
function useQuestCache(id: string) {
  const queryClient = useQueryClient()
  return (quest: StudentQuestDetail) => {
    queryClient.setQueryData(questKey(id), quest)
    void queryClient.invalidateQueries({ queryKey: questsKey })
    // L'XP, le niveau, la série et les badges suivent sans recharger la page.
    void queryClient.invalidateQueries({ queryKey: progressKey })
  }
}

/** L'élève ouvre la quête : elle passe de « À faire » à « En cours ». */
export function useStartQuest(id: string) {
  const store = useQuestCache(id)
  return useMutation({
    mutationFn: () =>
      api<StudentQuestResponse>(`/api/quests/${id}/start`, { method: 'POST', body: {} }),
    onSuccess: ({ quest }) => store(quest),
  })
}

export type AttemptBody = Partial<AttemptRequest>

export function useSubmitAttempt(id: string) {
  const store = useQuestCache(id)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AttemptBody) =>
      api<StudentQuestResponse>(`/api/quests/${id}/attempts`, { method: 'POST', body }),
    onSuccess: ({ quest }) => store(quest),
    // Réponse refusée (deadline passée entre-temps, quête archivée…) : l'état réel est relu.
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: questKey(id) })
      void queryClient.invalidateQueries({ queryKey: questsKey })
    },
  })
}
