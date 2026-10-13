import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  // ─── پایه ───
  js.configs.recommended,

  // ─── TypeScript ───
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
      // ─── imports مرده (auto-fix داره ✅) ───
      'unused-imports/no-unused-imports': 'error',

      // ─── متغیرهای استفاده‌نشده (هشدار، auto-fix نداره) ───
      'unused-imports/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      // خاموش کردن نسخه TypeScript (چون بالا رو داریم)
      '@typescript-eslint/no-unused-vars': 'off',

      // ─── any — هشدار ───
      '@typescript-eslint/no-explicit-any': 'warn',

      // ─── let → const ───
      'prefer-const': 'error',

      // ─── خاموش (چون الان خیلی خطا می‌ده) ───
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-empty': 'off',
      'no-cond-assign': 'off',
      'no-useless-escape': 'off',
    },
  },

  // ─── فایل‌های غیرقابل lint ───
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'android/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
      'vite.config.ts',
      'vitest.config.ts',
      'eslint.config.js',
      'scripts/**',
    ],
  },
];
