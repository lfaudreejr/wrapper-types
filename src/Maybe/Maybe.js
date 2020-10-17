const daggy = require('daggy')
const { isFunction, isNothing } = require('../helpers')

const TYPE = 'Maybe'
const _value = Symbol('_value')

const Maybe = daggy.taggedSum('Maybe', {
  Nothing: [],
  Just: [_value],
})

Maybe.prototype.map = function (fn) {
  if (!isFunction(fn)) throw new Error('Maybe.map expects a function')

  return this.cata({
    Nothing: () => this,
    Just: x => Maybe.of(fn(x)),
  })
}

Maybe.prototype.chain = function (fn) {
  if (!isFunction(fn)) throw new Error('Maybe.chain expects a function')

  return this.cata({
    Nothing: () => this,
    Just: x => this.map(fn).extract(),
  })
}

Maybe.prototype.ap = function (other) {
  if (!Maybe.is(other)) throw new Error('Maybe.ap expects a Maybe')

  return this.cata({
    Nothing: () => this,
    Just: () => other.chain(f => this.map(f)),
  })
}

Maybe.prototype.extend = function (fn) {
  if (!isFunction(fn)) throw new Error('Maybe.extend expects a function')

  return this.cata({
    Nothing: () => this,
    Just: () => Maybe.of(fn(this)),
  })
}

Maybe.prototype.extract = function () {
  return this.cata({
    Nothing: () => null,
    Just: x => x,
  })
}

Maybe.prototype.isNothing = function () {
  return this.cata({
    Nothing: () => true,
    Just: () => false,
  })
}

Maybe.of = function (x) {
  return !isNothing(x) ? Maybe.Just(x) : Maybe.Nothing
}

module.exports = Maybe
