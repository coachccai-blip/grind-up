import type { Config, Context } from '@netlify/functions'
import { localDeployContext, localSettings } from '../../server/local.js'
import { getApp } from '../../server/runtime.js'

/**
 * Point d'entrée unique de l'API : Netlify lui transmet toutes les requêtes
 * sous /api/, et les routes sont définies dans server/app.ts.
 */
export default async (request: Request, context: Context): Promise<Response> => {
  const settings = localSettings()
  return getApp().fetch(request, {
    ip: context.ip,
    local: settings.local,
    // Sur Netlify, « production » pour le site publié ; en local, « dev ».
    deployContext: settings.local
      ? localDeployContext(settings)
      : context.deploy?.context || undefined,
  })
}

export const config: Config = {
  path: ['/api', '/api/*'],
}
