const { test } = require('./core')

test(`
module.exports = function(e) {
  var t = require("../util"), i = null;
  return t.ext(e.prototype, {});
}
`)
