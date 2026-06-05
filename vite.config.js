/* global Buffer, process */
import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import bootstrapHandler from './api/admin/bootstrap.js'
import createUserHandler from './api/admin/create-user.js'
import updateUserHandler from './api/admin/update-user.js'
import deleteUsersHandler from './api/admin/delete-users.js'
import uploadUserAvatarHandler from './api/admin/upload-user-avatar.js'
import healthHandler from './api/health.js'
import uploadAvatarHandler from './api/storage/upload-avatar.js'
import uploadAchievementImageHandler from './api/storage/upload-achievement-image.js'
import deleteAchievementImageHandler from './api/storage/delete-achievement-image.js'

const collectRawBody = async (req) => {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined

  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  if (chunks.length === 0) return undefined
  return Buffer.concat(chunks)
}

const attachJsonHelpers = (res) => {
  res.status = (code) => {
    res.statusCode = code
    return res
  }

  res.json = (payload) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
    }
    res.end(JSON.stringify(payload))
    return res
  }

  return res
}

const devApiPlugin = () => {
  const routes = new Map([
    ['/api/health', healthHandler],
    ['/api/admin/bootstrap', bootstrapHandler],
    ['/api/admin/create-user', createUserHandler],
    ['/api/admin/update-user', updateUserHandler],
    ['/api/admin/delete-users', deleteUsersHandler],
    ['/api/admin/upload-user-avatar', uploadUserAvatarHandler],
    ['/api/storage/upload-avatar', uploadAvatarHandler],
    ['/api/storage/upload-achievement-image', uploadAchievementImageHandler],
    ['/api/storage/delete-achievement-image', deleteAchievementImageHandler],
  ])

  return {
    name: 'kusgan-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? new URL(req.url, 'http://localhost') : null
        const handler = url ? routes.get(url.pathname) : null

        if (!handler) {
          next()
          return
        }

        try {
          req.body = await collectRawBody(req)
          attachJsonHelpers(res)
          await handler(req, res)
        } catch (error) {
          server.ssrFixStacktrace(error)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ message: error?.message || 'Dev API error.' }))
          }
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vite loads `.env*` into `import.meta.env` for the browser bundle, but our dev API handlers
  // run in the Node dev server and expect `process.env.*` like Vercel serverless.
  const env = loadEnv(mode, process.cwd(), '')
  const disableFastRefresh = String(env.VITE_DISABLE_FAST_REFRESH || '').trim().toLowerCase() === 'true'

  process.env.SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL || ''
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || ''
  process.env.BOOTSTRAP_SECRET = process.env.BOOTSTRAP_SECRET || env.BOOTSTRAP_SECRET || ''

  return {
    plugins: [react({ fastRefresh: !disableFastRefresh }), tailwindcss(), devApiPlugin()],
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              try {
                const nm = id.split(`node_modules${path.sep}`)[1]
                const parts = nm.split(path.sep)
                let pkg = parts[0]
                if (pkg && pkg.startsWith('@')) {
                  pkg = `${pkg}/${parts[1]}`
                }
                // common large packages we want isolated
                if (pkg === 'react' || pkg === 'react-dom') return 'vendor-react'
                if (pkg === 'lucide-react') return 'vendor-lucide'
                if (pkg.startsWith('@supabase')) return 'vendor-supabase'
                if (pkg === 'dayjs') return 'vendor-dayjs'
                // normalize package name for chunk file
                const sanitized = pkg.replace('@', '').replace('/', '-')
                return `vendor-${sanitized}`
              } catch (e) {
                return 'vendor'
              }
            }
            const pagesPath = path.resolve(__dirname, 'src', 'pages')
            if (id.startsWith(pagesPath)) {
              const parts = id.split(path.sep)
              const name = parts[parts.length - 1].replace(/\.jsx?$/, '')
              return `page-${name}`
            }
          },
        },
      },
    },
  }
})
