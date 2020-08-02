const identity = any => any
const freeze = object => Object.freeze(object)
const applyFnTo = any => fn => fn(any)
const isFunction = fn => typeof fn === 'function'
const noop = () => {}

module.exports = {
  identity,
  freeze,
  applyFnTo,
  isFunction,
  noop,
}
