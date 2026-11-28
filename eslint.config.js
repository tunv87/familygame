import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dev-dist',
      'coverage',
      'playwright-report',
      'test-results',
      'android',
      'ios',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['scripts/**/*.mjs', 'qa/**/*.mjs'],
    languageOptions: {
      globals: {
        URL: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        // inside page.evaluate() callbacks (they run in the browser)
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        getComputedStyle: 'readonly',
      },
    },
  },
);
