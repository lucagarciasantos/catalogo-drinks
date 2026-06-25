import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Exportamos o Context junto do Provider no mesmo arquivo (padrao comum
      // do React). Esta regra so afeta o Fast Refresh em dev, nao a correcao.
      'react-refresh/only-export-components': 'off',
      // Carregar dados / resetar estado de formulario dentro de useEffect e
      // intencional aqui (busca ao logar, preenchimento do form ao abrir).
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
