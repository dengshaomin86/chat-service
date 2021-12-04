module.exports = {
  root: true,
  // 指定环境
  env: {
    es6: true,
    node: true,
    browser: true,
    commonjs: true,
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
  // extends: "eslint-config-egg",
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    quotes: [1, 'single'],
    semi: [2, 'always'],
    'space-before-function-paren': 0,
    'spaced-comment': [0, 'never'],
    'no-unreachable': [0, 'never'],
    indent: 0,
    'comma-dangle': 'off',
    'object-curly-spacing': ['error', 'always'], // 解构赋值和导入/导出说明符
  },
};
