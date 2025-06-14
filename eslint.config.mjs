import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // 1) Базовые правила JS
  js.configs.recommended,

  // 2) Рекомендованные + type-checked правила для TS
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // 3) Наши общие дополнения (работают и для .js, и для .ts)
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json', // нужно только один раз —
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { import: importPlugin },
    settings: {
      // чтобы eslint-plugin-import умел понимать .ts-пути
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
    rules: {
      // группировка и сортировка импортов
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // немножко TS-чистоты
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },

  // 4) Ставит точку: отключает правила, конфликтующие с Prettier
  prettier,
];
