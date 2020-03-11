module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: 'google',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'arrow-parens': ['error', 'as-needed'],
    // Prettier takes care of indentation.
    'indent': 'off',
    // Prettier takes care of this.
    'max-len': 'off',
    // Prettier.
    'object-curly-spacing': 'off',
  },
};
