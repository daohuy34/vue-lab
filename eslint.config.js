module.exports = {
  root: true,
  plugins: ['@antfu/eslint-config'],
  extends: ['plugin:@typescript-eslint/recommended-type-checked'],
  rules: {
    'no-console': 'warn',
    'no-debugger': 'warn',
  },
};
