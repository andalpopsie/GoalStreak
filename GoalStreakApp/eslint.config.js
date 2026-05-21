// ESLint 9 flat config for Goalfer
// Migrated from .eslintrc.js — equivalent rules with ESLint 9 compatibility

const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const reactPlugin = require('eslint-plugin-react');
const reactNativePlugin = require('eslint-plugin-react-native');

module.exports = [
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'ios/**',
      'android/**',
      '.expo/**',
      'dist/**',
      'build/**',
      'web-build/**',
      'scripts/**',
      'coverage/**',
      'firebase/**',
      'app-store-assets/**',
      'plugins/**',
      '**/*.config.js',
      'metro.config.js',
      'babel.config.js',
      'jest.config.js',
    ],
  },

  // Base recommended JS rules
  js.configs.recommended,

  // TypeScript recommended rules (flat config aware)
  ...tseslint.configs.recommended,

  // Project-specific rules for app source
  {
    files: ['src/**/*.{ts,tsx}', 'App.tsx', 'index.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // React Native globals
        __DEV__: 'readonly',
        // Browser/Node common globals used in RN
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        // Jest
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-native': reactNativePlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',

      // React
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',

      // React Native
      'react-native/no-unused-styles': 'warn',
      'react-native/no-inline-styles': 'off',
      'react-native/no-color-literals': 'off',

      // General
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-empty': 'warn',
      'no-undef': 'off', // TypeScript handles this
      // Stylistic — warn rather than error so they don't block CI
      'no-useless-escape': 'warn',
      'no-case-declarations': 'warn',
    },
  },

  // Test file overrides
  {
    files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
