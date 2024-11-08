const a = require('a');
const b = require('b');
const { c: renameC, c2 } = require('c');
const { d: renameD, d2 } = require('d');

console.log('a', a);
console.log('d', renameD);