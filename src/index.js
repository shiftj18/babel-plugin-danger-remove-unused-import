/**
 * @file: index
 * @author: Cuttle Cong
 * @date: 2017/11/29
 * @description:
 */
const match = require('./utils/matchRule')

function isIgnore(opts, name) {
  return opts && opts.ignore && match(opts.ignore, name)
}

module.exports = function(babel) {
  const t = babel.types
  return {
    visitor: {
      Program: {
        enter: (path, { opts } = {}) => {
          const bindings = path.scope.bindings
          const UnRefBindings = new Map()

          for (const [name, binding] of Object.entries(bindings)) {
            if (!binding.path.parentPath || binding.kind !== 'module') continue

            const source = binding.path.parentPath.get('source')
            const importName = source.node.value
            if (!t.isStringLiteral(source) || isIgnore(opts, importName))
              continue

            const key =
              importName +
              '(' +
              (source.node.loc && source.node.loc.start.line) +
              ')'
            if (!UnRefBindings.has(key)) {
              UnRefBindings.set(key, binding)
            }

            if (binding.referenced) {
              UnRefBindings.set(key, null)
            } else {
              const nodeType = binding.path.node.type
              if (nodeType === 'ImportSpecifier') {
                binding.path.remove()
              } else if (nodeType === 'ImportDefaultSpecifier') {
                binding.path.remove()
              } else if (nodeType === 'ImportNamespaceSpecifier') {
                binding.path.remove()
              } else if (binding.path.parentPath) {
                binding.path.parentPath.remove()
              }
            }
          }

          UnRefBindings.forEach(function(binding, key) {
            if (binding && binding.path.parentPath) {
              binding.path.parentPath.remove()
            }
          })

          path.traverse({
            CallExpression(callPath) {
              // 检查是否是 require()
              if (t.isIdentifier(callPath.node.callee, { name: 'require' })) {
                const source = callPath.node.arguments[0]
                if (
                  t.isStringLiteral(source) &&
                  !isIgnore(opts, source.value)
                ) {
                  if (t.isVariableDeclarator(callPath.parent)) {
                    if (t.isIdentifier(callPath.parent.id)) {
                      // 情况 const a = require('a');
                      const objName =
                        callPath.parent.id && callPath.parent.id.name
                      if (objName && !bindings[objName].referenced) {
                        callPath.parentPath.parentPath.remove()
                      }
                    } else if (t.isObjectPattern(callPath.parent.id)) {
                      // 情况 const { c1, c2 } = require('c');
                      // 情况 const { d1: rename, d2 } = require('c');
                      const keys = callPath.parent.id.properties.map(
                        it => it.value.name
                      )
                      if (keys.every(key => !bindings[key].referenced)) {
                        callPath.parentPath.parentPath.remove()
                      }
                    }
                  }
                }
              }
            }
          })
        }
      }
    }
  }
}
