/** Format des erreurs renvoyées par l'API. Les messages sont affichables tels quels. */
export interface ApiErrorBody {
  error: {
    /** Code stable, pour le traitement par l'interface. */
    code: string
    message: string
    /** Messages par champ de formulaire, quand la saisie est en cause. */
    fields?: Record<string, string>
    /** Délai avant de réessayer, en secondes (limitation des tentatives). */
    retryAfterSeconds?: number
  }
}
