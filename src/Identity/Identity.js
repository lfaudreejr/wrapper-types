const daggy = require('daggy')
const {
  freeze,
  isFunction,
  wrapsFunction,
  wrapsSomething,
  wrapsType,
} = require('../helpers')

const TYPE = 'Identity'
const _value = Symbol('_value')

const Identity = daggy.tagged('Identity', [_value])

Identity.prototype.map = function (fn) {
  if (!isFunction(fn)) throw new Error('Identity.map expects a function')

  return Identity(fn(this[_value]))
}

Identity.prototype.extend = function (fn) {
  if (!isFunction(fn)) throw new Error('Identity.extend expects a function')

  return Identity(fn(this))
}

Identity.prototype.extract = function () {
  return this[_value]
}

Identity.prototype.chain = function (fn) {
  if (!isFunction(fn)) throw new Error('Identity.chain expects a function')

  return this.map(fn).extract()
}

Identity.prototype.ap = function (other) {
  if (!Identity.is(other)) throw new Error('Identity.ap expects an Identity')

  return other.chain(f => this.map(f))
}

Identity.prototype.equals = function (other) {
  if (!Identity.is(other)) return false
  return this.extract() === other.extract()
}

Identity.of = function (x) {
  return Identity(x)
}

module.exports = Identity
