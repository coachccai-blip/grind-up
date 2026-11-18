import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AdminQuestDetail,
  AdminQuestResponse,
  AdminQuestsResponse,
  Assignees,
  AssignmentResponse,
  RejectRequest,
  SaveQuestRequest,
  ValidationsResponse,
} from '../../../../shared/schemas/quests'
import { api, errorMessage } from '../../../lib/api'

/** Quêtes et validations, pour l'espace admin. */
const questsKey = ['admin', 'quests'] as const
const questKey = (id: string) => ['admin', 'quest', id] as const
const validationsKey = ['admin', 'validations'] as const

/** Les élèves font avancer ces données sans l'admin : elles sont relues à chaque retour sur l'écran. */
const FRESHNESS = { staleTime: 10_000, refetchOnWindowFocus: true } as const

export function useAdminQuests() {
  return useQuery({
    queryKey: questsKey,
    queryFn: async ({ signal }) =>
      (await api<AdminQuestsResponse>('/api/admin/quests', { signal })).quests,
    ...FRESHNESS,
  })
}

export function useAdminQuest(id: string | undefined) {
  return useQuery({
    queryKey: questKey(id ?? ''),
    queryFn: async ({ signal }) =>
      (await api<AdminQuestResponse>(`/api/admin/quests/${id}`, { signal })).quest,
    enabled: id !== undefined,
    ...FRESHNESS,
  })
}

export function useValidations() {
  return useQuery({
    queryKey: validationsKey,
    queryFn: async ({ signal }) =>
      (await api<ValidationsResponse>('/api/admin/validations', { signal })).validations,
    ...FRESHNESS,
  })
}

/** Range la quête renvoyée par le serveur et fait relire les listes qui en dépendent. */
function useQuestCache() {
  const queryClient = useQueryClient()
  return {
    store: (quest: AdminQuestDetail) => {
      queryClient.setQueryData(questKey(quest.id), quest)
      void queryClient.invalidateQueries({ queryKey: questsKey })
      void queryClient.invalidateQueries({ queryKey: validationsKey })
    },
    forget: (id: string) => {
      queryClient.removeQueries({ queryKey: questKey(id) })
      void queryClient.invalidateQueries({ queryKey: questsKey })
    },
    refresh: (questId?: string) => {
      void queryClient.invalidateQueries({ queryKey: validationsKey })
      void queryClient.invalidateQueries({ queryKey: questsKey })
      if (questId) void queryClient.invalidateQueries({ queryKey: questKey(questId) })
    },
  }
}

/** Ce que devient l'image de la consigne à l'enregistrement. */
export type ImageChange =
  { kind: 'keep' } | { kind: 'remove' } | { kind: 'replace'; dataUrl: string }

export interface SaveQuestResult {
  quest: AdminQuestDetail
  /** La quête est enregistrée, mais son image n'a pas pu l'être : le message dit pourquoi. */
  imageError: string | null
}

/**
 * Crée une quête (sans identifiant) ou enregistre ses modifications, puis son
 * image si elle a changé. Un échec de l'image ne perd pas la quête.
 */
export function useSaveQuest(id: string | undefined) {
  const cache = useQuestCache()
  return useMutation({
    mutationFn: async ({
      request,
      image,
    }: {
      request: SaveQuestRequest
      image: ImageChange
    }): Promise<SaveQuestResult> => {
      const saved = id
        ? await api<AdminQuestResponse>(`/api/admin/quests/${id}`, { method: 'PUT', body: request })
        : await api<AdminQuestResponse>('/api/admin/quests', { method: 'POST', body: request })
      if (image.kind === 'keep') return { quest: saved.quest, imageError: null }
      try {
        const address = `/api/admin/quests/${saved.quest.id}/image`
        const withImage =
          image.kind === 'remove'
            ? await api<AdminQuestResponse>(address, { method: 'DELETE' })
            : await api<AdminQuestResponse>(address, {
                method: 'PUT',
                body: { dataUrl: image.dataUrl },
              })
        return { quest: withImage.quest, imageError: null }
      } catch (error) {
        return { quest: saved.quest, imageError: errorMessage(error) }
      }
    },
    onSuccess: ({ quest }) => cache.store(quest),
  })
}

type QuestAction = 'publish' | 'duplicate' | 'archive' | 'restore'

/** Publier, dupliquer, archiver ou restaurer une quête. */
export function useQuestAction(id: string, action: QuestAction) {
  const cache = useQuestCache()
  return useMutation({
    mutationFn: () =>
      api<AdminQuestResponse>(`/api/admin/quests/${id}/${action}`, { method: 'POST', body: {} }),
    onSuccess: ({ quest }) => cache.store(quest),
  })
}

export function useDeleteDraft(id: string) {
  const cache = useQuestCache()
  return useMutation({
    mutationFn: () => api<void>(`/api/admin/quests/${id}`, { method: 'DELETE' }),
    onSuccess: () => cache.forget(id),
  })
}

export function useAddAssignees(id: string) {
  const cache = useQuestCache()
  return useMutation({
    mutationFn: (assignees: Assignees) =>
      api<AdminQuestResponse>(`/api/admin/quests/${id}/assignees`, {
        method: 'POST',
        body: { assignees },
      }),
    onSuccess: ({ quest }) => cache.store(quest),
  })
}

type AssignmentAction =
  | { action: 'validate'; body?: { comment?: string } }
  | { action: 'reject'; body: RejectRequest }
  | { action: 'reopen'; body?: undefined }
  | { action: 'attempts'; body: { count: number } }

/** Valider ou refuser une réalisation, rouvrir une quête expirée, redonner des tentatives. */
export function useAssignmentAction(questId?: string) {
  const cache = useQuestCache()
  return useMutation({
    mutationFn: ({ assignmentId, ...request }: AssignmentAction & { assignmentId: string }) =>
      api<AssignmentResponse>(`/api/admin/assignments/${assignmentId}/${request.action}`, {
        method: 'POST',
        body: request.body ?? {},
      }),
    onSettled: () => cache.refresh(questId),
  })
}
