import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_|^s$',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_|^err$',
        ignoreRestSiblings: true,
      }],
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-empty': 'off',
      'no-cond-assign': 'off',
      'no-useless-escape': 'off',
    },
  },
    {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/shr/utils/fa.ts', 'src/shr/units/**', 'src/test/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='toFa']",
          message: "Use useFormat() or getGlobalFormat() instead of calling toFa() directly.",
        },
        {
          selector: "CallExpression[callee.property.name='toLocaleString'][arguments.0.value='fa-IR']",
          message: "Use useFormat() or getGlobalFormat() instead of .toLocaleString('fa-IR').",
        },
      ],
    },
  },
  {
    ignores: [
      'dist/**', 'node_modules/**', 'android/**', 'coverage/**',
      '*.config.js', '*.config.ts', 'vite.config.ts', 'vitest.config.ts',
      'eslint.config.js', 'scripts/**',
    ],
  },
];
