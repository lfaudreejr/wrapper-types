const fc = require('fast-check')
const { expect, assert } = require('chai')
const helpers = require('./')
const { applyFnTo, identity, freeze, isFunction } = require('./')

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

describe('isFunction', () => {
  it('returns true if value is a function else false', () => {
    assert.isTrue(isFunction(() => {}))
    assert.isFalse(isFunction(2))
    assert.isFalse(isFunction('string'))
    assert.isFalse(isFunction(false))
    assert.isFalse(isFunction(undefined))
  })
})
