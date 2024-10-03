module.exports = {
  extends: [
    'next/core-web-vitals',
    // 其他扩展...
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }],
    // 其他规则...
  },
};