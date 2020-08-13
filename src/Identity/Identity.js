const {
  freeze,
  isFunction,
  wrapsFunction,
  wrapsSomething,
  wrapsType,
} = require('../helpers')

const type = 'Identity'
const typeFn = () => type

const Identity = wrapsSomething('Identity')(x =>
  freeze({
    valueOf: () => x,
    map: wrapsFunction('Identity.map')(f => Identity(f(x))),
    chain: wrapsFunction('Identity.chain')(f => {
      const i = f(x)

      if (!i || !i.type || i.type !== type)
        throw new TypeError('function must return an Identity')

      return i
    }),
    ap: wrapsType(Identity)(identity => {
      if (!isFunction(x))
        throw new TypeError('Identity.ap wrapped value must be a function')

      return identity.map(x)
    }),
    equals: wrapsType(Identity)(identity => x === identity.valueOf()),
    type,
    of: Identity,
    toString: typeFn,
    constructor: Identity,
  })
)

Identity.of = Identity
Identity.type = type
Identity['@@type'] = type

Object.defineProperty(Identity, Symbol.hasInstance, {
  value: instance => instance['@@type'] === type,
})

module.exports = Identity
