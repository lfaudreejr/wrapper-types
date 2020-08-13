const fc = require('fast-check')
const { expect, assert } = require('chai')
const { applyFnTo, identity } = require('../helpers')
const Identity = require('./Identity')

describe('Identity', () => {
  it('is a function', function () {
    expect(Identity).to.be.a.instanceof(Function)
  })
  it('will throw an error if not given a value', function () {
    expect(Identity).to.throw()
  })
  it('returns an object', function () {
    fc.assert(
      fc.property(fc.anything(), random => assert.isObject(Identity(random)))
    )
  })
  it('has type of "Identity"', function () {
    assert.equal(Identity.type, 'Identity')
  })
  it('has @@type of "Identity"', function () {
    assert.equal(Identity['@@type'], 'Identity')
  })
  it('is sealed (frozen)', function () {
    fc.assert(
      fc.property(fc.anything(), any => {
        expect(Identity(any)).to.be.sealed
      })
    )
  })
  it('implements the Monad spec (left identity, right identity)', function () {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (intOne, intTwo) => {
        const iOne = Identity.of(intOne)
        // left identity
        expect(
          Identity.of(intOne)
            .chain(x => Identity(intTwo))
            .valueOf()
        ).to.be.equal(identity(intTwo))
        // right identity
        expect(iOne.chain(x => Identity.of(x)).valueOf()).to.be.equal(intOne)
      })
    )
  })
})

describe('Identity.equals', () => {
  it('is a Setoid implementing [fantasy-land/equals]', function () {
    fc.assert(
      fc.property(fc.string(), fc.boolean(), fc.integer(), (str, bool, num) => {
        //reflexivity
        assert.isTrue(Identity(str).equals(Identity(str)))
        //symmetry
        assert.isTrue(
          Identity(num).equals(Identity(bool)) ===
            Identity(bool).equals(Identity(num))
        )
        // transitivity
        assert.isTrue(
          Identity(num).equals(Identity(str)) ===
            Identity(str).equals(Identity(bool))
        )
        assert.isFalse(Identity(str).equals(Identity(bool)))
      })
    )
  })
})

describe('Identity.valueOf', () => {
  it('extracts the value contained within the Identity', function () {
    fc.assert(
      fc.property(fc.anything(), any =>
        assert.deepEqual(Identity(any).valueOf(), any)
      )
    )
  })
})

describe('Identity.map', () => {
  it('expects a function argument', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        const map = Identity(any).map
        assert.throws(map, 'Identity.map must wrap function')
      })
    )
  })
  it('returns an Identity', function () {
    fc.assert(
      fc.property(fc.anything(), any => {
        expect(Identity(any).map(identity).type).to.equal(Identity.type)
      })
    )
  })
  it('is a Functor implementing [fantasy-land/map]', function () {
    fc.assert(
      fc.property(fc.integer(), int => {
        const addOne = x => x + 1
        const timesTwo = x => x * 2
        const addOneThenTimesTwo = x => timesTwo(addOne(x))
        //identity
        assert.isTrue(
          Identity(int)
            .map(a => a)
            .valueOf() === int
        )
        //composition
        assert.isTrue(
          Identity(int).map(addOneThenTimesTwo).valueOf() ===
            Identity(int).map(addOne).map(timesTwo).valueOf()
        )
      })
    )
  })
})

describe('Identity.chain', () => {
  it('expects a function argument', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        const chain = Identity(any).chain
        assert.throws(chain, 'Identity.chain must wrap function')
      })
    )
  })
  it('function argument must return an Identity', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        const i = Identity(any)
        expect(i.chain(x => Identity(x)).type).to.equal(Identity.type)
        expect(i.chain.bind(i, identity)).to.throw(
          'function must return an Identity'
        )
      })
    )
  })
  it('implements Chain [fantasy-land/chain]', function () {
    const f = x => Identity(x + 1)
    const g = x => Identity(x + 2)
    fc.assert(
      fc.property(fc.integer(), int => {
        const i = Identity(int)
        // associativity
        expect(i.chain(f).chain(g).valueOf()).to.be.equal(
          i.chain(x => f(x).chain(g)).valueOf()
        )
      })
    )
  })
})

describe('Identity.ap', () => {
  it('is an Apply implementing [fantasy-land/ap]', function () {
    const compose = f => g => x => f(g(x))
    const i = Identity(identity)
    const testOne = i.map(compose).ap(i).ap(i)
    const testTwo = i.ap(i.ap(i))

    //composition
    assert.equal(
      testOne.ap(Identity(3)).valueOf(),
      testTwo.ap(Identity(3)).valueOf()
    )
  })
})

describe('Identity.of', () => {
  it('is an Applicative implementing [fantasy-land/of]', () => {
    fc.assert(
      fc.property(fc.integer(), int => {
        expect(Identity(0).of).to.be.equal(Identity.of)
        const i = Identity(identity)

        //identity
        expect(i.ap(Identity.of(int)).valueOf()).to.be.equal(int)
        // homomorphism
        expect(i.ap(Identity.of(int)).valueOf()).to.be.equal(
          Identity.of(identity(int)).valueOf()
        )
        // interchange
        expect(i.ap(Identity.of(int)).valueOf()).to.be.equal(
          Identity.of(applyFnTo(int)).ap(i).valueOf()
        )
      })
    )
  })
})
