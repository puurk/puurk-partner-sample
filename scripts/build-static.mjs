/**
 * Collects the static (serverless) storefront into dist-static/ for any
 * static host: the page in public/ plus static/config.js as /config.js.
 *
 * Usage: npm run build:static
 */

import { cpSync, copyFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist-static')

rmSync(out, { recursive: true, force: true })
cpSync(join(root, 'public'), out, { recursive: true })
copyFileSync(join(root, 'static', 'config.js'), join(out, 'config.js'))
console.log(`Static storefront written to ${out}. Upload the folder to any static host.`)
