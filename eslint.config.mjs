// eslint.config.mjs
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import js from '@eslint/js';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // 1) Базовые правила JS
  js.configs.recommended,

  // 2) Рекомендованные + type-checked правила для TS
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // 3) Наши общие дополнения
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { import: importPlugin },
    settings: {
      'import/resolver': {
        'import/order': 'off',
      },
    },
    rules: {
      // отключаем потенциальные конфликты
      'import/order': 'off',

      // Убираем "ложную тревогу" от строгой типизации
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',

      // Умеренная строгость
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },

  // 4) Prettier в конце отключает конфликтующие правила форматирования
  prettier,
];
