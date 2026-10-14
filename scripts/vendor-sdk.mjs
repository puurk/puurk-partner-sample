/**
 * Builds @puurk/js from a local checkout and copies its UMD bundle to
 * public/vendor/puurk.js for the example storefront.
 *
 * Usage: npm run vendor-sdk [-- <path to puurk-js>]
 * The path defaults to PUURK_JS_DIR, then ../puurk-js. Once the SDK is on
 * the js.puurk.com CDN, set PUURK_JS_URL instead and skip vendoring.
 */

import { execSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sdkDir = resolve(root, process.argv[2] || process.env.PUURK_JS_DIR || '../puurk-js')
const dest = join(root, 'public', 'vendor', 'puurk.js')

if (!existsSync(join(sdkDir, 'package.json'))) {
  console.error(`No puurk-js checkout found at ${sdkDir}`)
  process.exit(1)
}

const pkg = JSON.parse(readFileSync(join(sdkDir, 'package.json'), 'utf8'))
if (pkg.name !== '@puurk/js') {
  console.error(`${sdkDir} is ${pkg.name}, not @puurk/js`)
  process.exit(1)
}

const run = cmd => execSync(cmd, { cwd: sdkDir, stdio: 'inherit', shell: true })
if (!existsSync(join(sdkDir, 'node_modules'))) run('npm ci --no-audit --no-fund')
run('npm run build')

let revision = 'unknown'
try {
  revision = execSync('git rev-parse --short HEAD', { cwd: sdkDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
} catch {
  // Not a git checkout (e.g. an exported tree); leave the revision unknown.
}

mkdirSync(dirname(dest), { recursive: true })
copyFileSync(join(sdkDir, 'dist', 'puurk.js'), dest)
const bundle = readFileSync(dest, 'utf8')
writeFileSync(dest, `/*! @puurk/js v${pkg.version} (${revision}) — vendored by scripts/vendor-sdk.mjs */\n${bundle}`)
console.log(`Vendored @puurk/js v${pkg.version} (${revision}) → public/vendor/puurk.js`)
