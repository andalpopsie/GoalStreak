module.exports = {
  extends: [
    './.eslintrc.js',
    'plugin:security/recommended'
  ],
  plugins: ['security'],
  rules: {
    // Security-focused rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    
    // Additional security checks
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Prevent hardcoded secrets
    'no-secrets/no-secrets': 'error'
  },
  overrides: [
    {
      files: ['**/__tests__/**/*', '**/*.test.*'],
      rules: {
        // Relax some security rules for tests
        'security/detect-non-literal-fs-filename': 'off',
        'security/detect-child-process': 'off'
      }
    }
  ]
};