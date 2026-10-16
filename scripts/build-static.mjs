/**
 * Collects the static (serverless) storefront into dist-static/ for any
 * static host: the page in public/ plus a config file as /config.js.
 *
 * Usage: npm run build:static [-- --config path/to/config.js] [--noindex]
 *
 *   --config   The config to publish as /config.js (default static/config.js).
 *   --noindex  Also write a robots.txt that disallows all crawling, for
 *              deployments that shouldn't appear in search results.
 */

import { cpSync, copyFileSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist-static')
const arg = name => {
  const index = process.argv.indexOf(`--${name}`)
  return index > -1 ? process.argv[index + 1] : undefined
}
const configPath = resolve(arg('config') || join(root, 'static', 'config.js'))
const noindex = process.argv.includes('--noindex')

if (!existsSync(configPath)) {
  console.error(`Config not found: ${configPath}`)
  process.exit(1)
}

rmSync(out, { recursive: true, force: true })
cpSync(join(root, 'public'), out, { recursive: true })
copyFileSync(configPath, join(out, 'config.js'))
if (noindex) writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
console.log(`Static storefront written to ${out} (config: ${configPath}${noindex ? ', noindex' : ''}). Upload the folder to any static host.`)
