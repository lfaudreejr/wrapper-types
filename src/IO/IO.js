const { freeze, isFunction, wrapsFunction, wrapsType } = require('../helpers')

const type = 'IO'
const typeFn = () => type

const IO = wrapsFunction('IO')(run =>
  freeze({
    of: _of,
    map: wrapsFunction('IO.map')(fn => IO(() => fn(run()))),
    ap: wrapsType(IO)(other =>
      IO(() => {
        const ran = run()
        if (!isFunction(ran))
          throw new TypeError('IO.ap run must return function')
        return other.map(ran).run()
      })
    ),
    chain: wrapsFunction('IO.chain')(fn =>
      IO(() => {
        const unwrapped = fn(run())
        if (!unwrapped || unwrapped.type != type)
          throw new TypeError('IO.chain must return IO')
        return unwrapped.run()
      })
    ),
    concat: wrapsType(IO)(other => IO(() => other.map(run).run())),
    run,
    type,
    toString: typeFn,
    constructor: IO,
  })
)

let _of = x => IO(() => x)

IO.of = _of
IO.type = type
IO['@@type'] = type

Object.defineProperty(IO, Symbol.hasInstance, {
  value: instance => instance['@@type'] === type,
})

module.exports = IO
