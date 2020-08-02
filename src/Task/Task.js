const { freeze, isFunction } = require('../helpers')

const type = 'Task'
const typeFn = () => type

const _of = x => Task((_, res) => res(x))

function Task(executor) {
  if (!isFunction(executor)) throw new TypeError('Task must wrap a function')

  const fork = function fork(reject, resolve) {
    if (!isFunction(reject) || !isFunction(resolve))
      throw new TypeError('Task.fork (reject, resolve) must be functions')

    return executor(reject, resolve)
  }

  const map = function map(fn) {
    if (!isFunction(fn))
      throw new TypeError('Task.map expects function argument')

    return Task((rej, res) => fork(rej, x => res(fn(x))))
  }

  const chain = function chain(fn) {
    if (!isFunction(fn))
      throw new TypeError('Task.chain expects function argument')

    return Task((rej, res) => fork(rej, x => fn(x).fork(rej, res)))
  }

  const ap = function ap(other) {
    if (other.type() !== Task.type())
      throw new TypeError('Task.ap expects an identity')

    // Apply f => f a ~> f (a -> b) -> f b
    return Task((rej, res) =>
      fork(rej, fn => {
        if (!isFunction(fn))
          throw new TypeError('Task.ap wrapped value must be a function')
        return other.fork(rej, x => res(fn(x)))
      })
    )
  }

  return freeze({
    fork,
    map,
    chain,
    ap,
    of: _of,
    type: typeFn,
    constructor: Task,
  })
}

Task.of = _of
Task.type = typeFn
Task['@@type'] = type

module.exports = Task
