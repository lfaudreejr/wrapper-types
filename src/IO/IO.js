const daggy = require('daggy')
const { freeze, isFunction, wrapsFunction, wrapsType } = require('../helpers')

const TYPE = 'IO'
const _value = Symbol('_value')

const io = daggy.tagged('IO', [_value])

const IO = function (fn) {
  if (!isFunction(fn)) throw new Error('IO expects a function')

  return io(fn)
}

io.prototype.run = function () {
  return this[_value]()
}

io.prototype.map = function (fn) {
  if (!isFunction(fn)) throw new Error('IO.map expects a function')

  return IO(() => fn(this.run()))
}

io.prototype.ap = function (other) {
  if (!IO.is(other)) throw new Error('IO.ap expects an IO')

  return other.map(f => f(this.run()))
}

io.prototype.chain = function (fn) {
  if (!isFunction(fn)) throw new Error('IO.chain expects a function')

  if (!IO.is(fn())) throw new Error('argument must return an IO')

  return this.map(fn).run()
}

IO.is = function (x) {
  return io.is(x)
}

IO.of = function (x) {
  return IO(() => x)
}

module.exports = IO
