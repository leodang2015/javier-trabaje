import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer as createViteServer } from 'vite'
import { app as backendApp } from './backend/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = 3000
const isProd = process.env.NODE_ENV === 'production'

async function startServer() {
  const app = express()

  // Montar rutas de backend
  app.use(backendApp)

  if (!isProd) {
    // Modo desarrollo: Vite middlewares en el mismo puerto 3000
    const vite = await createViteServer({
      root: path.resolve(__dirname, 'frontend'),
      configFile: path.resolve(__dirname, 'frontend/vite.config.js'),
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false
      },
      appType: 'spa'
    })

    app.use(vite.middlewares)
  } else {
    // Modo producción: Servir archivos estáticos generados por build
    const distPath = path.resolve(__dirname, 'dist')
    app.use(express.static(distPath))
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next()
      res.sendFile(path.resolve(distPath, 'index.html'))
    })
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full-Stack Applet] Servidor corriendo exitosamente en el puerto ${PORT}`)
  })
}

startServer().catch((err) => {
  console.error('Error al iniciar el servidor:', err)
  process.exit(1)
})
