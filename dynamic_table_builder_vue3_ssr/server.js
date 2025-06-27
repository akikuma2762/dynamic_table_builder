import express from 'express'
import { createServer as createViteServer } from 'vite'
import fs from 'fs'
import path from 'path'

async function createServer() {
  const app = express()
  const vite = await createViteServer({
    server: { middlewareMode: 'ssr' }
  })
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    const url = req.originalUrl
    let template = fs.readFileSync(path.resolve('index.html'), 'utf-8')
    template = await vite.transformIndexHtml(url, template)
    const { render } = await vite.ssrLoadModule('/src/entry-server.ts')
    const appHtml = await render(url)
    const html = template.replace(`<!--ssr-outlet-->`, appHtml)
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  })

  app.listen(5173, () => {
    console.log('SSR server running at http://localhost:5173')
  })
}
createServer()
