const fc = require('fast-check')
const sinon = require('sinon')
const { expect, assert } = require('chai')
const helpers = require('./')
const IO = require('../IO/IO')
const { identity, isFunction, typeCheck, isNothing } = require('./')

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

describe('isNothing', () => {
  it('returns true if value is null or undefined', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        fc.pre(any !== null && any !== undefined)
        assert.isFalse(isNothing(any))

        assert.isTrue(isNothing(undefined))
        assert.isTrue(isNothing(null))
      })
    )
  })
})
