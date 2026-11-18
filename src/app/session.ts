import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext } from 'react'
import type {
  ChangePasswordRequest,
  LoginRequest,
  SessionResponse,
  SessionUser,
} from '../../shared/schemas/auth'
import { clearWelcomePending, markWelcomePending } from '../features/auth/welcome-pending'
import { api } from '../lib/api'

/**
 * Session en cours. Le serveur est la seule source de vérité : l'interface lui
 * demande qui est connecté, et met sa réponse en mémoire pour toute la visite.
 */
export const sessionQueryKey = ['session'] as const

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: ({ signal }) => api<SessionResponse>('/api/session', { signal }),
    staleTime: Infinity,
  })
}

/**
 * L'utilisateur connecté, fourni par la protection des pages (RequireUser) à
 * tous les écrans qu'elle entoure. Un écran protégé le lit ici plutôt que dans
 * la session : il ne peut donc jamais s'afficher sans utilisateur, même à
 * l'instant d'une déconnexion.
 */
export const CurrentUserContext = createContext<SessionUser | null>(null)

/** L'utilisateur connecté. À n'utiliser que dans un écran protégé. */
export function useCurrentUser(): SessionUser {
  const user = useContext(CurrentUserContext)
  if (!user) throw new Error('useCurrentUser() est utilisé hors d’un écran protégé.')
  return user
}

/** Les mutations de session remplacent la session en mémoire par la réponse du serveur. */
function useSessionMutation<Input>(send: (input: Input) => Promise<SessionResponse>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: send,
    onSuccess: (session) => {
      queryClient.setQueryData(sessionQueryKey, session)
      // Un autre compte arrive : rien de ce qui était en mémoire ne doit lui être montré.
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== sessionQueryKey[0] })
    },
  })
}

export interface SignupInput {
  pseudo: string
  password: string
  specialCode: string
}

export function useSignup() {
  return useSessionMutation(async (input: SignupInput) => {
    const session = await api<SessionResponse>('/api/auth/signup', { method: 'POST', body: input })
    // Un élève tout juste inscrit découvre d'abord son identifiant.
    if (session.user?.role === 'student') markWelcomePending()
    return session
  })
}

export function useLogin() {
  return useSessionMutation((input: LoginRequest) =>
    api<SessionResponse>('/api/auth/login', { method: 'POST', body: input }),
  )
}

export function useLogout() {
  return useSessionMutation(async () => {
    await api<void>('/api/auth/logout', { method: 'POST', body: {} })
    clearWelcomePending()
    return { user: null }
  })
}

export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ChangePasswordRequest) =>
      api<SessionResponse>('/api/account/password', { method: 'POST', body: input }),
    onSuccess: (session) => queryClient.setQueryData(sessionQueryKey, session),
  })
}

/** Page d'accueil de chaque rôle. */
export function homePathFor(user: SessionUser): string {
  return user.role === 'admin' ? '/admin' : '/'
}
