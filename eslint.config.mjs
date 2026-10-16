import js from '@eslint/js'
import globals from 'globals'

export default [
  // public/vendor/ is the vendored @puurk/js build; dist-static/ is build output.
  { ignores: ['node_modules/', 'public/vendor/', 'dist-static/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
  {
    // The storefront page's classic <script> files.
    files: ['public/**/*.js', 'static/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: globals.browser,
    },
  },
  {
    files: ['tests/**/*.js', '*.mjs', 'scripts/**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.node,
    },
  },
]
