const {
  freeze,
  isFunction,
  wrapsFunction,
  wrapsFunctions,
  wrapsType,
} = require('../helpers')

const type = 'Task'
const typeFn = () => type

const Task = wrapsFunction('Task')(executor =>
  freeze({
    of: _of,
    map: wrapsFunction('Task.map')(fn =>
      Task((rej, res) => executor(rej, x => res(fn(x))))
    ),
    chain: wrapsFunction('Task.chain')(fn =>
      Task((rej, res) => executor(rej, x => fn(x).fork(rej, res)))
    ),
    ap: wrapsType(Task)(other =>
      Task((rej, res) =>
        wrapsFunction('Task.fork')(
          executor(rej, fn => other.fork(rej, x => res(fn(x))))
        )
      )
    ),
    toString: typeFn,
    constructor: Task,
    fork: wrapsFunctions('Task.fork')(executor),
    type,
  })
)

let _of = x => Task((_, res) => res(x))

Task.of = _of
Task.type = type
Task['@@type'] = type

Object.defineProperty(Task, Symbol.hasInstance, {
  value: instance => instance['@@type'] === type,
})

module.exports = Task
