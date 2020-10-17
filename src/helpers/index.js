const identity = any => any
const applyFnTo = any => fn => fn(any)
const typeCheck = typeName => type => typeof type === typeName
const isFunction = typeCheck('function')
const noop = () => {}
const isNothing = x => x === null || x === undefined

module.exports = {
  identity,
  applyFnTo,
  typeCheck,
  isFunction,
  noop,
  isNothing,
}
