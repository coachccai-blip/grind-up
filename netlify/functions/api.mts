import type { Config, Context } from '@netlify/functions'
import { getApp } from '../../server/runtime.js'

/**
 * Contexte de déploiement de la requête. En local (`npm run dev` ou `netlify dev`),
 * Netlify pose NETLIFY_DEV ou NETLIFY_LOCAL : on parle alors du contexte « dev ».
 * Sur Netlify, c'est « production » pour le site publié.
 */
function deployContextOf(context: Context): string | undefined {
  if (process.env.NETLIFY_DEV || process.env.NETLIFY_LOCAL) return 'dev'
  return context.deploy?.context || undefined
}

/**
 * Point d'entrée unique de l'API : Netlify lui transmet toutes les requêtes
 * sous /api/, et les routes sont définies dans server/app.ts.
 */
export default async (request: Request, context: Context): Promise<Response> => {
  return getApp().fetch(request, {
    ip: context.ip,
    deployContext: deployContextOf(context),
  })
}

export const config: Config = {
  path: ['/api', '/api/*'],
}
