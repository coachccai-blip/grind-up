import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { router } from './app/router'
import { sessionQueryKey } from './app/session'
import { markSessionExpired } from './features/auth/session-expired'
import { ApiError } from './lib/api'

/**
 * Quand le serveur ne reconnaît plus la session (expirée, compte désactivé,
 * mot de passe changé ailleurs), l'interface l'oublie : l'utilisateur est
 * renvoyé à l'écran de connexion, avec une explication.
 */
function forgetSessionIfRejected(error: unknown): void {
  if (!(error instanceof ApiError) || error.code !== 'unauthenticated') return
  if (queryClient.getQueryData<{ user: unknown }>(sessionQueryKey)?.user) markSessionExpired()
  queryClient.setQueryData(sessionQueryKey, { user: null })
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: forgetSessionIfRejected }),
  mutationCache: new MutationCache({ onError: forgetSessionIfRejected }),
  defaultOptions: {
    queries: {
      // Pas d'actualisation automatique : les données se rechargent quand on navigue ou qu'on agit.
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) =>
        failureCount < 1 &&
        error instanceof ApiError &&
        (error.status === 0 || error.status >= 500),
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
