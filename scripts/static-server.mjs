/**
 * Serves the static (serverless) storefront locally: static/config.js plus
 * the page in public/. It is only a file server; any static host (S3,
 * Netlify, GitHub Pages, Firebase Hosting) serves the same files. Use
 * `npm run build:static` to collect them into one folder for hosting.
 *
 * Usage: npm run static [-- --port 4849 --config path/to/config.js]
 */

import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { dirname, extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const arg = name => {
  const index = process.argv.indexOf(`--${name}`)
  return index > -1 ? process.argv[index + 1] : undefined
}
const port = Number(arg('port') || process.env.STATIC_PORT || 4849)
const configPath = resolve(arg('config') || join(root, 'static', 'config.js'))
const publicDir = join(root, 'public')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
}

/**
 * Resolves a request path to a file in public/, or null. Paths can't
 * escape the folder, and extensionless paths try `.html` like most hosts.
 * @param {string} pathname URL path.
 * @return {string|null}
 */
function publicFile (pathname) {
  const relative = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '')
  const base = join(publicDir, relative === '' ? 'index.html' : relative)
  if (!base.startsWith(publicDir + sep) && base !== publicDir) return null
  for (const candidate of [base, `${base}.html`, join(base, 'index.html')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost')
  const file = pathname === '/config.js' ? configPath : publicFile(pathname)
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
    return
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
  createReadStream(file).pipe(res)
}).listen(port, () => {
  console.log(`Static storefront (no server-side code) at http://localhost:${port}`)
  console.log(`  config: ${configPath}`)
})
