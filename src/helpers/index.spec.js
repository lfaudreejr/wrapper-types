const fc = require('fast-check')
const sinon = require('sinon')
const { expect, assert } = require('chai')
const helpers = require('./')
const IO = require('../IO/IO')
const {
  applyFnTo,
  identity,
  freeze,
  isFunction,
  typeCheck,
  wrapsFunction,
  wrapsFunctions,
  checkFnArg,
  wrapsType,
} = require('./')

describe('identity', () => {
  it('returns the value it was given', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        fc.pre(!isNaN(any))
        expect(identity(any)).to.be.equal(any)
      })
    )
  })
})

describe('freeze', () => {
  it('shallow freezes the object properties', () => {
    fc.assert(
      fc.property(fc.object(), fc.anything(), (obj, anyvalue) => {
        const frozen = freeze(obj)

        expect(frozen).to.be.sealed
      })
    )
  })
})

describe('applyFnTo', () => {
  it('(value, fn) => fn(value)', () => {
    fc.assert(
      fc.property(fc.integer(), int => {
        expect(applyFnTo(int)(identity)).to.be.equal(int)
      })
    )
  })
})

describe('typeCheck', () => {
  it('returns true if given type is typeof wrapped type', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.string(),
        fc.integer(),
        fc.object(),
        (bool, str, int, obj) => {
          assert.isTrue(typeCheck('string')(str))
          assert.isTrue(typeCheck('number')(int))
          assert.isTrue(typeCheck('boolean')(bool))
          assert.isTrue(typeCheck('object')(obj))

          assert.isFalse(typeCheck('string')(int))
          assert.isFalse(typeCheck('number')(obj))
          assert.isFalse(typeCheck('boolean')(str))
          assert.isFalse(typeCheck('object')(bool))
        }
      )
    )
  })
})

describe('isFunction', () => {
  it('returns true if value is a function else false', () => {
    assert.isTrue(isFunction(() => {}))
    assert.isFalse(isFunction(2))
    assert.isFalse(isFunction('string'))
    assert.isFalse(isFunction(false))
    assert.isFalse(isFunction(undefined))
  })
})

describe('checkFnArg', () => {
  it('throws if wrapped fn argument does not match type check', () => {
    const test = checkFnArg('string')('TestFn')(x => x)
    assert.doesNotThrow(test.bind(null, 'testing'))
    assert.throws(test.bind(null, 123))
    assert.throws(test.bind(null, () => {}))
  })
})

describe('wrapsFunction', () => {
  it('throws if argument to wrapped fn is not a function', () => {
    const test = wrapsFunction('TestFn')(x => x)
    assert.doesNotThrow(test.bind(null, () => {}))
    assert.throws(test.bind(null, 123))
    assert.throws(test.bind(null, 'hello'))
  })
})

describe('wrapsFunctions', () => {
  it('throws if all arguments to wrapped fn is not a function', () => {
    const test = wrapsFunctions('TestFn')((rej, res) => res(2))
    assert.doesNotThrow(
      test.bind(
        null,
        () => {},
        () => {}
      )
    )
    assert.throws(test.bind(null, 123))
    assert.throws(test.bind(null, () => {}, 123))
    assert.throws(test.bind(null, 'hello', () => {}))
  })
})

describe('wrapsType', () => {
  it('throws if argument type does not match type', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        const wrapped = wrapsType(IO)(other => other)

        assert.throws(wrapped.bind(wrapped, any))
        assert.doesNotThrow(wrapped.bind(wrapped, IO))
      })
    )
  })
})
