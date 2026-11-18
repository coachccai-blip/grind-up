/**
 * Réglage des données que d'autres font évoluer : l'admin valide une quête, un
 * élève en termine une, une deadline passe. Elles sont relues à chaque ouverture
 * d'écran et à chaque retour sur l'onglet du navigateur ; en attendant la
 * réponse, l'écran montre ce qu'il connaît déjà.
 */
export const LIVE = { staleTime: 0, refetchOnWindowFocus: true } as const
