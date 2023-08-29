module.exports = {
  env: {
    es2021: true,
    node: true,
    mocha: true,
  },
  extends: ['codfish', 'codfish/dapp'],
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs}', 'src/**/*.mjs'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-underscore-dangle': 'off',
    'no-console': 'off',
  },
};
