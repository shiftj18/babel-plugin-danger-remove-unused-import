const { transform } = require('@babel/core')

function dce(code) {
  return transform(code, {
    plugins: [[require('../src/index')]]
  }).code
}

function test(source, ...args) {
  console.log(dce(source), ...args)
  console.log('---------------------------------------\n')
}

module.exports = {
  dce,
  test
}
