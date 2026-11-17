import { useEffect, useState } from 'react'
import type { HealthReport } from '../../../shared/health'
import { APP_VERSION } from '../../../shared/version'
import { ApiUnavailableError, fetchHealth } from '../../lib/api'
import './deploy-check.css'

/**
 * Étape 1 : page du test de déploiement. Elle montre que le site statique est
 * en ligne, que la fonction serveur répond et que la base enregistre.
 */
interface DisplayedCheck {
  id: string
  label: string
  ok: boolean
  detail: string
}

type TestState =
  | { status: 'running' }
  | { status: 'done'; report: HealthReport; responseMs: number }
  | { status: 'unreachable'; reason: string }

function toDisplayedChecks(state: TestState): DisplayedCheck[] {
  const checks: DisplayedCheck[] = [
    { id: 'page', label: 'Affichage de la page', ok: true, detail: 'Le site est en ligne.' },
  ]
  if (state.status === 'unreachable') {
    checks.push({
      id: 'api',
      label: 'Appel de la fonction serveur',
      ok: false,
      detail: state.reason,
    })
  }
  if (state.status === 'done') {
    checks.push({
      id: 'api',
      label: 'Appel de la fonction serveur',
      ok: true,
      detail: `Réponse reçue en ${state.responseMs} ms.`,
    })
    for (const check of state.report.checks) {
      checks.push({
        id: check.id,
        label: check.label,
        ok: check.ok,
        detail: `${check.detail} (${check.durationMs} ms)`,
      })
    }
  }
  return checks
}

export function DeployCheckPage() {
  const [state, setState] = useState<TestState>({ status: 'running' })
  // Numéro du test en cours : l'augmenter relance le test.
  const [runNumber, setRunNumber] = useState(1)
  const [copyFeedback, setCopyFeedback] = useState('')

  useEffect(() => {
    const run = new AbortController()
    const startedAt = performance.now()

    fetchHealth(run.signal).then(
      (report) => {
        if (run.signal.aborted) return
        setState({ status: 'done', report, responseMs: Math.round(performance.now() - startedAt) })
      },
      (error: unknown) => {
        if (run.signal.aborted) return
        const reason =
          error instanceof ApiUnavailableError
            ? error.message
            : 'Une erreur inattendue est survenue pendant le test.'
        setState({ status: 'unreachable', reason })
      },
    )

    return () => run.abort()
  }, [runNumber])

  const runAgain = () => {
    setState({ status: 'running' })
    setCopyFeedback('')
    setRunNumber((current) => current + 1)
  }

  const copyDetail = async () => {
    const detail = JSON.stringify(
      { page: window.location.href, version: APP_VERSION, state },
      null,
      2,
    )
    try {
      await navigator.clipboard.writeText(detail)
      setCopyFeedback('Détail copié.')
    } catch {
      setCopyFeedback('Copie impossible : ouvrez /api/sante et copiez son contenu.')
    }
  }

  const checks = toDisplayedChecks(state)
  const running = state.status === 'running'
  const succeeded = state.status === 'done' && state.report.ok
  const resultModifier = running
    ? ''
    : succeeded
      ? 'deploy-check__result--ok'
      : 'deploy-check__result--ko'

  return (
    <div className="page">
      <header>
        <h1 className="deploy-check__title">Grind up</h1>
        <p className="deploy-check__subtitle">Test de déploiement · étape 1 sur 6</p>
      </header>

      <main className="deploy-check__main">
        <section className={`card deploy-check__result ${resultModifier}`} aria-live="polite">
          <h2 className="deploy-check__result-title">
            {running ? 'Vérification en cours…' : succeeded ? 'Test réussi' : 'Test en échec'}
          </h2>
          <p>
            {running
              ? 'Le site interroge sa fonction serveur et sa base.'
              : state.status === 'done'
                ? state.report.message
                : 'La fonction serveur ne répond pas : voir le détail ci-dessous.'}
          </p>
        </section>

        <section className="card" aria-labelledby="checks-title">
          <h2 id="checks-title" className="deploy-check__section-title">
            Vérifications
          </h2>
          <ul className="deploy-check__checks">
            {checks.map((check) => (
              <li key={check.id} className="deploy-check__check">
                <div className="deploy-check__check-head">
                  <span className="deploy-check__check-label">{check.label}</span>
                  {check.ok ? (
                    <span className="deploy-check__status deploy-check__status--ok">
                      <span aria-hidden="true">✅ </span>Réussi
                    </span>
                  ) : (
                    <span className="deploy-check__status deploy-check__status--ko">Échec</span>
                  )}
                </div>
                <p className="deploy-check__check-detail">{check.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="deploy-check__actions">
          <button className="button button--primary" onClick={runAgain} disabled={running}>
            Relancer le test
          </button>
          <button className="button button--secondary" onClick={() => void copyDetail()}>
            Copier le détail
          </button>
        </div>
        <p className="deploy-check__hint" role="status">
          {copyFeedback || 'En cas d’échec, copiez le détail et transmettez-le pour diagnostic.'}
        </p>
      </main>

      <footer className="deploy-check__footer">Grind up v{APP_VERSION}</footer>
    </div>
  )
}
