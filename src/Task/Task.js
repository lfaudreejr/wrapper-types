const daggy = require('daggy')
const { isFunction } = require('../helpers')

const TYPE = 'Task'
const _value = Symbol('_value')

const task = daggy.tagged('Task', [_value])

const Task = function (fork) {
  if (!isFunction(fork)) throw new Error('Task expects a function')

  return task(fork)
}

task.prototype.fork = function (reject, resolve) {
  if (!isFunction(reject) || !isFunction(resolve))
    throw new Error('fork expects two function arguments')

  return this[_value](reject, resolve)
}

task.prototype.map = function (fn) {
  if (!isFunction(fn)) throw new Error('Task.map expects a function')

  return Task((rej, res) => this.fork(rej, x => res(fn(x))))
}

task.prototype.ap = function (other) {
  if (!Task.is(other)) throw new Error('Task.ap expects a Task')

  return Task((rej, res) =>
    other.fork(rej, fn => this.fork(rej, x => res(fn(x))))
  )
}

task.prototype.chain = function (fn) {
  if (!isFunction(fn)) throw new Error('Task.chain expects a function')

  return Task((rej, res) => this.fork(rej, x => fn(x).fork(rej, res)))
}

Task.is = function (other) {
  return task.is(other)
}

Task.of = function (x) {
  return Task((rej, res) => res(x))
}

Task.rejected = function (x) {
  return Task((rej, res) => rej(x))
}

module.exports = Task
