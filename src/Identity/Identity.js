const { freeze, isFunction } = require('../helpers')

const type = 'Identity'
const typeFn = () => type

const _of = Identity

function Identity(x) {
  if (arguments.length == 0) throw new TypeError('Identity must wrap a value')

  const extract = function extract() {
    return x
  }

  const map = function map(f) {
    if (!isFunction(f)) throw new TypeError('Identity.map expects a function')

    return Identity(f(x))
  }

  const chain = function chain(f) {
    if (!isFunction(f)) throw new TypeError('Identity.chain expects a function')

    const i = f(x)

    if (!i || !i.type || i.type !== type)
      throw new TypeError('function must return an Identity')

    return i
  }

  const ap = function ap(identity) {
    if (!isFunction(x))
      throw new TypeError('Identity.ap wrapped value must be a function')

    if (identity.type !== Identity.type)
      throw new TypeError('Identity.ap expects an identity')

    return identity.map(x)
  }

  const equals = function equals(identity) {
    return type === identity.type && x === identity.extract()
  }

  return freeze({
    extract,
    map,
    chain,
    ap,
    equals,
    type,
    of: _of,
    toString: typeFn,
    constructor: Identity,
  })
}

Identity.of = _of
Identity.type = type
Identity['@@type'] = type

module.exports = Identity
