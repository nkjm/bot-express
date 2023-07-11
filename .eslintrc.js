module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true
  },
  extends: [
    'standard-with-typescript'
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    "semi": ["error", "never", { "beforeStatementContinuationChars": "never" }],
    "semi-spacing": ["error", { "after": true, "before": false }],
    "semi-style": ["error", "first"],
    "no-extra-semi": "error",
    "no-unexpected-multiline": "error",
    "no-unreachable": "error"
  },
  ignorePatterns: ['**/*.js'], // only lint ts file
}
