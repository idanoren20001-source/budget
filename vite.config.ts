import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

function centralStoragePlugin(): Plugin {
  const storeFilePath = path.resolve(process.cwd(), 'data_store.json')
  console.log('[CentralStorage] Using store file:', storeFilePath, 'Exists:', fs.existsSync(storeFilePath))


  return {
    name: 'central-storage-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // 1. Health check
        if (req.url === '/api/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }))
          return
        }

        // 2. GET /api/data
        if (req.url?.startsWith('/api/data') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const exists = fs.existsSync(storeFilePath)
            console.log('[CentralStorage] GET /api/data, exists:', exists, 'path:', storeFilePath)
            if (exists) {
              const content = fs.readFileSync(storeFilePath, 'utf-8')
              res.end(content)
            } else {
              res.end(JSON.stringify({ exists: false }))
            }
          } catch (err: any) {
            console.error('[CentralStorage] Error:', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message }))
          }
          return
        }

        // 3. POST /api/data
        if (req.url === '/api/data' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            res.setHeader('Content-Type', 'application/json')
            try {
              const parsed = JSON.parse(body)
              const payload = {
                ...parsed,
                lastModified: new Date().toISOString(),
                version: (parsed.version || 0) + 1,
              }
              fs.writeFileSync(storeFilePath, JSON.stringify(payload, null, 2), 'utf-8')
              res.end(JSON.stringify({ success: true, version: payload.version, lastModified: payload.lastModified }))
            } catch (err: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    centralStoragePlugin(),
  ],
})


