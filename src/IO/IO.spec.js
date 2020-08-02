const fc = require('fast-check')
const { expect, assert } = require('chai')
const { identity, isFunction } = require('../helpers')
const IO = require('./IO')

describe('IO', () => {
  it('is a function', () => {
    assert.isTrue(isFunction(IO))
  })
  it('returns an object', () => {
    assert.isObject(IO(identity))
  })
  it('has type of "IO"', () => {
    assert.isTrue(IO.type() === 'IO')
  })
  it('has an "@@type" of "IO"', () => {
    assert.isTrue(IO['@@type'] === 'IO')
  })
  it('returns a sealed (frozen) object', () => {
    assert.sealed(IO(identity))
  })
})
