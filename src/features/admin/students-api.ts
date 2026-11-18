import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AdminStudent,
  AdminStudentResponse,
  AdminStudentsResponse,
  TemporaryPasswordResponse,
  UpdateStudentRequest,
} from '../../../shared/schemas/admin'
import { api } from '../../lib/api'

/** Données des comptes élèves, pour l'espace admin. */
const studentsKey = ['admin', 'students'] as const

export function useStudents() {
  return useQuery({
    queryKey: studentsKey,
    queryFn: async ({ signal }) =>
      (await api<AdminStudentsResponse>('/api/admin/students', { signal })).students,
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
