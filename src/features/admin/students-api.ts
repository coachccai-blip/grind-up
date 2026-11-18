import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AdminStudent,
  AdminStudentResponse,
  AdminStudentsResponse,
  TemporaryPasswordResponse,
  UpdateStudentRequest,
} from '../../../shared/schemas/admin'
import type {
  AdminStudentProgressResponse,
  XpAdjustmentRequest,
} from '../../../shared/schemas/progress'
import { api } from '../../lib/api'
import { LIVE } from '../../lib/freshness'

/** Données des comptes élèves, pour l'espace admin. */
const studentsKey = ['admin', 'students'] as const

export function useStudents() {
  return useQuery({
    queryKey: studentsKey,
    queryFn: async ({ signal }) =>
      (await api<AdminStudentsResponse>('/api/admin/students', { signal })).students,
    ...LIVE,
  })
}

/** Remplace un élève dans la liste en mémoire, pour que l'écran suive sans recharger. */
function useStudentCache() {
  const queryClient = useQueryClient()
  return {
    replace: (student: AdminStudent) =>
      queryClient.setQueryData<AdminStudent[]>(studentsKey, (students) =>
        students?.map((current) => (current.id === student.id ? student : current)),
      ),
    remove: (id: string) =>
      queryClient.setQueryData<AdminStudent[]>(studentsKey, (students) =>
        students?.filter((current) => current.id !== id),
      ),
  }
}

export function useUpdateStudent(id: string) {
  const cache = useStudentCache()
  return useMutation({
    mutationFn: (changes: UpdateStudentRequest) =>
      api<AdminStudentResponse>(`/api/admin/students/${id}`, { method: 'PATCH', body: changes }),
    onSuccess: ({ student }) => cache.replace(student),
  })
}

export function useTemporaryPassword(id: string) {
  return useMutation({
    mutationFn: () =>
      api<TemporaryPasswordResponse>(`/api/admin/students/${id}/temporary-password`, {
        method: 'POST',
        body: {},
      }),
  })
}

export function useDeleteStudent(id: string) {
  const cache = useStudentCache()
  return useMutation({
    mutationFn: () => api<void>(`/api/admin/students/${id}`, { method: 'DELETE' }),
    onSuccess: () => cache.remove(id),
  })
}

export const studentProgressKey = (id: string) => ['admin', 'student-progress', id] as const

/** Progression d'un élève : ses quêtes, son journal d'XP, sa série, ses badges. */
export function useStudentProgress(id: string) {
  return useQuery({
    queryKey: studentProgressKey(id),
    queryFn: async ({ signal }) =>
      (await api<AdminStudentProgressResponse>(`/api/admin/students/${id}/progress`, { signal }))
        .progress,
    ...LIVE,
  })
}

/** Ajustement manuel d'XP : une ligne de plus au journal de l'élève. */
export function useAdjustXp(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: XpAdjustmentRequest) =>
      api<AdminStudentProgressResponse>(`/api/admin/students/${id}/xp`, {
        method: 'POST',
        body: request,
      }),
    onSuccess: ({ progress }) => {
      queryClient.setQueryData(studentProgressKey(id), progress)
      void queryClient.invalidateQueries({ queryKey: studentsKey })
    },
  })
}
