module.exports = {
  '*.{json,css,scss,html}': ['prettier --write', 'git add'],
  '*.mjs': ['eslint --fix', 'git add'],
};
