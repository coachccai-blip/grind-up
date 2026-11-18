import { mkdirSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import type { ReadableStream as NodeReadableStream } from 'node:stream/web'
import { BlobsServer } from '@netlify/blobs/server'
import { createServer, type Connect, type Plugin, type ViteDevServer } from 'vite'

/**
 * Netlify en local, pour `npm run dev` et `npm run preview`.
 *
 * Ce module reproduit les deux choses dont l'application a besoin de Netlify :
 * - la fonction netlify/functions/api.mts, appelée pour toute adresse sous /api ;
 * - le stockage Netlify Blobs, servi par l'émulateur fourni avec @netlify/blobs
 *   et rangé dans .netlify/blobs-local.
 *
 * La fonction est chargée dans le processus de Vite : elle répond en quelques
 * millisecondes, garde sa mémoire d'une requête à l'autre comme sur Netlify, et
 * se recharge quand son code change. Sous `netlify dev`, c'est la CLI de Netlify
 * qui fait ce travail : ce module s'efface.
 */
const FUNCTION_ENTRY = '/netlify/functions/api.mts'
const BLOBS_TOKEN = 'local'

type FunctionHandler = (
  request: Request,
  context: { ip: string; deploy: { context: string } },
) => Promise<Response>

/** Démarre le stockage local et indique son adresse au client Netlify Blobs. */
async function startLocalBlobs(root: string): Promise<BlobsServer> {
  const directory = join(root, '.netlify', 'blobs-local')
  mkdirSync(directory, { recursive: true })
  const server = new BlobsServer({ directory, token: BLOBS_TOKEN })
  const { port } = await server.start()
  const address = `http://localhost:${port}`
  process.env.NETLIFY_BLOBS_CONTEXT = Buffer.from(
    JSON.stringify({
      edgeURL: address,
      uncachedEdgeURL: address,
      siteID: 'grind-up-local',
      token: BLOBS_TOKEN,
    }),
  ).toString('base64')
  // Même repère que l'émulateur de Netlify : l'application sait qu'elle tourne en local.
  process.env.NETLIFY_LOCAL = 'true'
  return server
}

function toWebRequest(nodeRequest: IncomingMessage): Request {
  const url = new URL(nodeRequest.url ?? '/', `http://${nodeRequest.headers.host ?? 'localhost'}`)
  const headers = new Headers()
  for (const [name, value] of Object.entries(nodeRequest.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item))
    else if (value !== undefined) headers.set(name, value)
  }
  const hasBody = nodeRequest.method !== 'GET' && nodeRequest.method !== 'HEAD'
  return new Request(url, {
    method: nodeRequest.method,
    headers,
    body: hasBody ? (Readable.toWeb(nodeRequest) as ReadableStream) : undefined,
    // Nécessaire pour transmettre un corps en flux.
    ...(hasBody ? { duplex: 'half' } : {}),
  } as RequestInit)
}

async function sendWebResponse(response: Response, nodeResponse: ServerResponse): Promise<void> {
  nodeResponse.statusCode = response.status
  response.headers.forEach((value, name) => {
    if (name.toLowerCase() !== 'set-cookie') nodeResponse.setHeader(name, value)
  })
  const cookies = response.headers.getSetCookie()
  if (cookies.length > 0) nodeResponse.setHeader('set-cookie', cookies)
  if (response.body) {
    Readable.fromWeb(response.body as NodeReadableStream).pipe(nodeResponse)
  } else {
    nodeResponse.end()
  }
}

/** Transmet à la fonction les requêtes sous /api, comme le fait Netlify. */
function apiMiddleware(loader: ViteDevServer): Connect.NextHandleFunction {
  return (nodeRequest, nodeResponse, next) => {
    const path = (nodeRequest.url ?? '/').split('?')[0] ?? '/'
    if (path !== '/api' && !path.startsWith('/api/')) {
      next()
      return
    }
    void (async () => {
      try {
        const module = (await loader.ssrLoadModule(FUNCTION_ENTRY)) as { default: FunctionHandler }
        const response = await module.default(toWebRequest(nodeRequest), {
          ip: nodeRequest.socket.remoteAddress ?? '127.0.0.1',
          deploy: { context: 'dev' },
        })
        await sendWebResponse(response, nodeResponse)
      } catch (error) {
        if (error instanceof Error) loader.ssrFixStacktrace(error)
        next(error)
      }
    })()
  }
}

export function localNetlify(): Plugin {
  // Lancé par `netlify dev`, le site reçoit déjà ses fonctions et son stockage de la CLI.
  const managedByNetlifyCli = Boolean(process.env.NETLIFY_DEV)
  let root = process.cwd()

  return {
    name: 'grind-up:local-netlify',
    apply: 'serve',

    configResolved(config) {
      root = config.root
    },

    // `npm run dev` : la fonction est chargée par le serveur de développement lui-même.
    async configureServer(server) {
      if (managedByNetlifyCli) return
      const blobs = await startLocalBlobs(root)
      server.httpServer?.once('close', () => void blobs.stop())
      server.middlewares.use(apiMiddleware(server))
    },

    // `npm run preview` : le site construit est servi tel quel ; un second serveur
    // Vite, sans page, ne sert qu'à charger le code de la fonction.
    async configurePreviewServer(server) {
      const blobs = await startLocalBlobs(root)
      const loader = await createServer({
        root,
        configFile: false,
        appType: 'custom',
        logLevel: 'warn',
        server: { middlewareMode: true, hmr: false, watch: null },
        optimizeDeps: { noDiscovery: true },
      })
      server.httpServer.once('close', () => {
        void blobs.stop()
        void loader.close()
      })
      server.middlewares.use(apiMiddleware(loader))
    },
  }
}
