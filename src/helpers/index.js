const identity = any => any
const freeze = object => Object.freeze(object)
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
const wrapsSomething = fnName => fn => (...args) => {
  if (args.length === 0) throw new TypeError(`${fnName} must wrap a value`)
  return fn(...args)
}
const wrapsType = type => fn => other => {
  if (
    !other instanceof type ||
    !other.hasOwnProperty('type') ||
    other.type !== type.type
  )
    throw new TypeError(`${type.type} expected`)
  return fn(other)
}
const noop = () => {}

module.exports = {
  identity,
  freeze,
  applyFnTo,
  typeCheck,
  isFunction,
  checkFnArg,
  checkFnArgs,
  noop,
  wrapsType,
  wrapsFunction: checkFnArg('function'),
  wrapsFunctions: checkFnArgs('function'),
  wrapsSomething,
}
