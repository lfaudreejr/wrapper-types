const identity = any => any
const applyFnTo = any => fn => fn(any)
const typeCheck = typeName => type => typeof type === typeName
const isFunction = typeCheck('function')
const checkFnArg = typeName => fnName => wrappedFn => input => {
  if (!isFunction(wrappedFn))
    throw new TypeError('checkFnArg expects a function')
  if (!typeCheck(typeName)(input))
    throw new TypeError(`${fnName} must wrap ${typeName}`)
  return wrappedFn(input)
}
const checkFnArgs = typeName => fnName => wrappedFn => (...args) => {
  if (!isFunction(wrappedFn))
    throw new TypeError('checkFnArg expects a function')
  for (let arg of args) {
    if (!typeCheck(typeName)(arg)) {
      throw new TypeError(`${fnName} must wrap ${typeName}`)
      return
    }
  }
  return wrappedFn(...args)
}
const noop = () => {}

module.exports = {
  identity,
  applyFnTo,
  typeCheck,
  isFunction,
  checkFnArg,
  checkFnArgs,
  noop,
}
