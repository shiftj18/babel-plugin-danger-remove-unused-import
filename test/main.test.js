/**
 * @file main
 * @author Cuttle Cong
 * @date 2018/11/5
 * @description
 */
const nps = require('path')
const fs = require('fs')
const { transform } = require('@babel/core')

function fixture(name) {
  return nps.join(__dirname, 'fixture', name)
}

function read(name) {
  return fs.readFileSync(fixture(name), { encoding: 'utf8' })
}

function transformTest(name, opts, { plugins = [], ...rest } = {}) {
  return transform(read(name), {
    plugins: [[require('../src'), opts]].concat(plugins),
    babelrc: false,
    ...rest
  })
}

describe('main', function() {
  describe('scope', () => {
    it('case 1', function() {
      expect(transformTest('scope/func.js').code).toMatchInlineSnapshot(`
        "function gn() {
          const abc = '123';
          return abc + '456';
        }"
      `)
    })
  })

  describe('unused', () => {
    it('JSX', () => {
      expect(
        transformTest('unused/JSX.js', {}, { presets: [require.resolve('@babel/preset-react')] }).code
      ).toMatchSnapshot()
    })

    it('VariableDeclarator', () => {
      expect(transformTest('unused/VariableDeclarator.js', {}).code).toMatchSnapshot()
    })

    it('LabeledStatement', () => {
      expect(transformTest('unused/LabeledStatement.js').code).toMatchSnapshot()
    })

    it('ObjectProperty', () => {
      expect(transformTest('unused/ObjectProperty.js', {}).code).toMatchSnapshot()
    })

    it('MemberExpression', () => {
      expect(transformTest('unused/MemberExpression.js').code).toMatchInlineSnapshot(`
        "const ref = {};
        const x = ref.Tab;"
      `)
    })

    it('MemberExpression-2', () => {
      expect(transformTest('unused/MemberExpression-2.js').code).toMatchInlineSnapshot(`
        "const ref = {};
        const x = ref['Tab'];"
      `)
    })

    it('class', function() {
      expect(transformTest('unused/class.js').code).toMatchInlineSnapshot(`
        "class A {
          Tab() {}
          static Tab() {}
        }"
      `)
    })

    it('multi-import', function() {
      expect(transformTest('unused/multi-import.js').code).toMatchInlineSnapshot(`
        "import { a, b } from 'lodash';
        import _ from 'lodash';
        _.a;
        _.b;
        const sum = a + b;"
      `)
    })

    it('require', function() {
      expect(transformTest('unused/require.js').code).toMatchInlineSnapshot(`
        "const a = require('a');
        const {
          d: renameD,
          d2
        } = require('d');
        console.log('a', a);
        console.log('d', renameD);"
      `)
    })

    it('require2', function() {
      expect(transformTest('unused/require2.js').code).toMatchInlineSnapshot(`
        "var x2 = require('x2');
        console.log('x2', x2);"
      `)
    })

    it('require3', function() {
      expect(transformTest('unused/require3.js').code).toMatchInlineSnapshot(`"var y = 1;"`)
    })
  })

  describe('used', () => {
    it('JSX', function() {
      expect(transformTest('used/JSX.js', {}, { presets: ['@babel/preset-react'] }).code).toMatchInlineSnapshot(`
        "import Tab from 'tab';
        const comp = /*#__PURE__*/React.createElement(Tab, null);"
      `)
    })

    it('ObjectProperty-computed', function() {
      expect(transformTest('used/ObjectProperty-computed.js', {}).code).toMatchInlineSnapshot(`
        "import Tab from 'tab';
        export const x = {
          [Tab]: 'abc',
          ...{
            a: '2'
          }
        };"
      `)
    })

    it('class-computed-method', function() {
      expect(transformTest('used/class-computed-method.js', {}).code).toMatchInlineSnapshot(`
        "import Tab from 'tab';
        export class A {
          [Tab]() {}
        }"
      `)
    })

    it('class-static-computed', function() {
      expect(transformTest('used/class-static-computed.js', {}, { presets: ['@babel/preset-react'] }).code)
        .toMatchInlineSnapshot(`
        "import Tab from 'tab';
        export class A {
          static [Tab]() {}
        }"
      `)
    })

    it('MemberExpression', function() {
      expect(transformTest('used/MemberExpression.js').code).toMatchInlineSnapshot(`
        "import * as t from './a';
        const obj = {
          [t.abc]: () => ({}),
          [t.abcd]: () => ({})
        };"
      `)
    })

    it('string-template', function() {
      expect(transformTest('used/string-template.js').code).toMatchInlineSnapshot(`
        "import * as sty from 'style';
        const css = \`
         \${sty} {}
        \`;"
      `)
    })

    it('string-template-2', function() {
      expect(transformTest('used/string-template-2.js').code).toMatchInlineSnapshot(`
        "import * as sty from 'style';
        const css = \`
         \${sty.color} {}
        \`;"
      `)
    })

    it('require-decarlations', function() {
      expect(transformTest('used/require-decarlations.js').code).toMatchSnapshot()
    })

    it('require2', function() {
      expect(transformTest('used/require2.js').code).toMatchSnapshot()
    })
  })

  describe('options', () => {
    it('options `ignore = [react]`', function() {
      expect(
        transformTest('options/ignore.js', { ignore: ['@babel/preset-react'] }, { presets: ['@babel/preset-react'] })
          .code
      ).toMatchInlineSnapshot(`"export default () => /*#__PURE__*/React.createElement("div", null, "hah");"`)
    })

    it('options `ignore = []`', function() {
      expect(
        transformTest('options/ignore.js', { ignore: [] }, { presets: ['@babel/preset-react'] }).code
      ).toMatchInlineSnapshot(`"export default () => /*#__PURE__*/React.createElement("div", null, "hah");"`)
    })
  })
})
