import pluginJs from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** @type {import('eslint').Linter.Config[]} */

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      sourceType: 'commonjs', // TypeScript-файлы в CommonJS
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'commonjs',
        ecmaVersion: 2021,
      },
    },
  },
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/no-commonjs': 'off', // Отключает ошибки на `require`
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off', // Отключает ошибки на `require` в TS
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Встроенные модули Node.js (fs, path)
            'external', // Пакеты из node_modules (react, express)
            'internal', // Внутренние модули проекта (@/utils, @/components)
            'parent', // Импорты через `../`
            'sibling', // Импорты через `./`
            'index', // Импорты `index.ts` / `index.js`
          ],
          'newlines-between': 'always', // Добавляет пустую строку между группами
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
]
