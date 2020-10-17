const fc = require('fast-check')
const { expect, assert } = require('chai')
const sinon = require('sinon')
const { identity, isFunction } = require('../helpers')
const Maybe = require('./Maybe')

describe('Maybe', () => {
  it('has an of type method', () => {
    assert.isTrue(typeof Maybe.of == 'function')
  })
  it('has an isNothing method', () => {
    assert.isTrue(typeof Maybe.prototype.isNothing == 'function')
  })
  it('has an extract method', () => {
    assert.isTrue(typeof Maybe.prototype.extract == 'function')
  })
  it('has an extend method', () => {
    assert.isTrue(typeof Maybe.prototype.extend == 'function')
  })
  it('has an map method', () => {
    assert.isTrue(typeof Maybe.prototype.map == 'function')
  })
  it('has a chain method', () => {
    assert.isTrue(typeof Maybe.prototype.chain == 'function')
  })
  it('has an ap method', () => {
    assert.isTrue(typeof Maybe.prototype.ap == 'function')
  })
  it('implements the Monad spec (left identity) (right identity)', () => {
    fc.assert(
      fc.property(fc.integer(), int => {
        // M['fantasy-land/of'](a)['fantasy-land/chain'](f) is equivalent to f(a) (left identity)

        const M = Maybe.of(int)
        const f = x => Maybe.of(x + x)

        assert.equal(M.chain(f).extract(), f(int).extract())
      })
    )
  })

  describe('Maybe.of', () => {
    it('returns a Maybe', () => {
      assert.isTrue(Maybe.is(Maybe.of(1)))
    })
    it('implements [fantasy-land/of] spec (identity)', () => {
      // v['fantasy-land/ap'](A['fantasy-land/of'](x => x)) is equivalent to v (identity)
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))
          const v = Maybe.of(any)

          assert.equal(v.ap(Maybe.of(identity)).extract(), any)
        })
      )
    })
    it('implements [fantasy-land/of] spec (homomorphism)', () => {
      // A['fantasy-land/of'](x)['fantasy-land/ap'](A['fantasy-land/of'](f)) is equivalent to A['fantasy-land/of'](f(x)) (homomorphism)
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))

          assert.equal(
            Maybe.of(any).ap(Maybe.of(identity)).extract(),
            Maybe.of(identity(any)).extract()
          )
        })
      )
    })
  })

  describe('Maybe.isNothing', () => {
    it('returns true if Maybe is Nil (undefined or null)', () => {
      assert.isTrue(Maybe.of(null).isNothing())
      assert.isTrue(Maybe.of(undefined).isNothing())
    })
  })

  describe('Maybe.map', () => {
    it('expects function as its argument', function () {
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))

          const maybe = Maybe.of(identity)
          assert.throw(
            maybe.map.bind(maybe, any),
            'Maybe.map expects a function'
          )
          assert.doesNotThrow(maybe.map.bind(maybe, identity))
        })
      )
    })
    it('obeys [fantasy-land/map] (identity) law', () => {
      // u['fantasy-land/map'](a => a) is equivalent to u (identity)
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))
          const maybe = Maybe.of(any)

          maybe.map(identity)
          assert.equal(maybe.extract(), any)
        })
      )
    })
    it('fulfills the [fantasy/land map] spec (composition)', () => {
      // u['fantasy-land/map'](x => f(g(x))) is equivalent to u['fantasy-land/map'](g)['fantasy-land/map'](f) (composition)
      fc.assert(
        fc.property(fc.integer(), int => {
          const u = Maybe.of(int)
          const f = x => x + x
          const g = x => x * x

          assert.equal(u.map(x => f(g(x))).extract(), u.map(g).map(f).extract())
        })
      )
    })
  })

  describe('Maybe.chain', () => {
    it('expects a function argument', () => {
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))

          const maybe = Maybe.of(any)
          assert.throw(
            maybe.chain.bind(maybe, any),
            'Maybe.chain expects a function'
          )
          assert.doesNotThrow(maybe.chain.bind(maybe, identity))
        })
      )
    })
    it('fulfills [fantasy-land/chain] spec (associativity)', () => {
      // m['fantasy-land/chain'](f)['fantasy-land/chain'](g) is equivalent to m['fantasy-land/chain'](x => f(x)['fantasy-land/chain'](g)) (associativity)
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (i1, i2) => {
          const m = Maybe.of(i1)
          const f = x => Maybe.of(x + i1)
          const g = x => Maybe.of(x + i2)

          assert.equal(
            m.chain(f).chain(g).extract(),
            m.chain(x => f(x).chain(g)).extract()
          )
        })
      )
    })
  })

  describe('Maybe.ap', () => {
    it('expects a Maybe argument', () => {
      fc.assert(
        fc.property(fc.anything(), any => {
          const maybe = Maybe.of(any)
          assert.throws(maybe.ap.bind(maybe, any), 'Maybe.ap expects a Maybe')
        })
      )
    })
    it('fulfills the [fantasy/land ap] spec (composition)', () => {
      // v['fantasy-land/ap'](u['fantasy-land/ap'](a['fantasy-land/map'](f => g => x => f(g(x))))) is equivalent to v['fantasy-land/ap'](u)['fantasy-land/ap'](a) (composition)
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (int1, int2) => {
          const o_f = x => x + int1
          const o_g = x => x * int2
          const composer = f => g => x => f(g(x))
          const v = Maybe.of(int1)
          const u = Maybe.of(o_g)
          const a = Maybe.of(o_f)
          assert.equal(
            v.ap(u.ap(a.map(composer))).extract(),
            v.ap(u).ap(a).extract()
          )
        })
      )
    })
  })

  describe('Maybe.extend', () => {
    it('expects a function argument', () => {
      fc.assert(
        fc.property(fc.anything(), any => {
          const maybe = Maybe.of(any)
          assert.throw(
            maybe.extend.bind(maybe, any),
            'Maybe.extend expects a function'
          )
          assert.doesNotThrow(maybe.extend.bind(maybe, identity))
        })
      )
    })
    it('fulfills the [fantasy/land extend] spec', () => {
      // w['fantasy-land/extend'](g)['fantasy-land/extend'](f) is equivalent to w['fantasy-land/extend'](_w => f(_w['fantasy-land/extend'](g)))
      fc.assert(
        fc.property(fc.integer(), int => {
          const maybe = Maybe.of(int)
          const f = _maybe => _maybe.extract() + int
          const g = _maybe => _maybe.extract() * int

          assert.equal(
            maybe.extend(g).extend(f).extract(),
            maybe.extend(_maybe => f(_maybe.extend(g))).extract()
          )
        })
      )
    })
  })

  describe('Maybe.extract', () => {
    it('obeys (left identity)', () => {
      // w['fantasy-land/extend'](_w => _w['fantasy-land/extract']()) is equivalent to w (left identity)
      fc.assert(
        fc.property(fc.integer(), x => {
          const w = Maybe.of(x)
          assert.equal(w.extend(_w => _w.extract()).extract(), w.extract())
        })
      )
    })
  })
})
