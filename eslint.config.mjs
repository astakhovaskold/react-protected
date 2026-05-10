import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import importPlugin from 'eslint-plugin-import'
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

const commonFiles = ['**/*.{js,cjs,mjs,ts,tsx}']
const tsFiles = ['**/*.{ts,tsx}']
const testFiles = ['**/tests/**/*.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}']
const configFiles = ['eslint.config.mjs', 'packages/*/vite.config.ts']

export default [
  {
    ignores: [
      '**/dist/**',
      '**/dist/**/*',
      'packages/*/dist/**',
      'packages/*/dist/**/*',
      '**/node_modules/**',
      '**/.pnpm-store/**',
      '**/coverage/**',
      'eslint.config.mjs',
    ],
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  ...compat.extends('airbnb', 'airbnb/hooks', 'airbnb-typescript'),
  {
    files: commonFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    settings: {
      react: {
        version: '19.0',
      },
      'import/resolver': {
        node: true,
        typescript: {
          project: './tsconfig.eslint.json',
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'jsx-a11y': jsxA11yPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'simple-import-sort': simpleImportSortPlugin,
    },
    rules: {
      'import/extensions': 'off',
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/tests/**',
            '**/*.{test,spec}.{ts,tsx}',
            'eslint.config.mjs',
            'packages/*/vite.config.ts',
          ],
        },
      ],
      'import/order': 'off',
      'import/prefer-default-export': 'off',
      'prefer-destructuring': 'off',
      'react/function-component-definition': 'off',
      'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
      'react/react-in-jsx-scope': 'off',
      'react/require-default-props': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    files: tsFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'generic',
          readonly: 'generic',
        },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          minimumDescriptionLength: 3,
          'ts-check': false,
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          disallowTypeAnnotations: false,
          prefer: 'type-imports',
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
          custom: {
            regex: '^T[A-Z]',
            match: false,
          },
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],
      'no-array-constructor': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    files: testFiles,
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
  {
    files: configFiles,
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },
  eslintConfigPrettier,
]
