module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-shadow': ['error', { 'allow': ['state'] }],
    'max-len': [2, 180, 4],
    "eol-last": 0,
    'comma-dangle': ['error', {
      'arrays': 'never',
      'objects': 'ignore',
      'imports': 'never',
      'exports': 'never',
      'functions': 'ignore'
    }]
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
};
