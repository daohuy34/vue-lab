const js = require('@eslint/js');
const ts = require('typescript-eslint');

module.exports = [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.ts', '**/*.d.ts'],
    languageOptions: {
      parser: ts.parser,
    },
    rules: {
      'no-console': 'off',
      'no-debugger': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
];
