const fc = require('fast-check')
const { expect, assert } = require('chai')
const { identity } = require('../helpers')
const Identity = require('./Identity')

describe('Identity', () => {
  it('returns an Identity', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        assert.isTrue(Identity.is(Identity(any)))
        assert.isFalse(Identity.is(any))
      })
    )
  })
  it('has a toString method', () => {
    assert.isTrue(typeof Identity.toString === 'function')
  })
  it('has an is method', () => {
    assert.isTrue(typeof Identity.is === 'function')
  })
  it('has a map method', () => {
    assert.isTrue(typeof Identity(2).map === 'function')
  })
  it('has an extract method', () => {
    assert.isTrue(typeof Identity(2).extract === 'function')
  })
  it('has an extend method', () => {
    assert.isTrue(typeof Identity(2).extend === 'function')
  })
  it('has a chain method', () => {
    assert.isTrue(typeof Identity(2).chain === 'function')
  })
  it('has an ap method', () => {
    assert.isTrue(typeof Identity(2).ap === 'function')
  })
  it('has an equals method', () => {
    assert.isTrue(typeof Identity(2).equals === 'function')
  })
  it('implements the Monad spec (left identity) (right identity)', () => {
    fc.assert(
      fc.property(fc.integer(), int => {
        // M['fantasy-land/of'](a)['fantasy-land/chain'](f) is equivalent to f(a) (left identity)

        const M = Identity.of(int)
        const f = x => Identity.of(x + x)

        assert.equal(M.chain(f).extract(), f(int).extract())
      })
    )
  })

  describe('Identity.map', () => {
    it('expects function as its argument', function () {
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))

          const id = Identity(identity)
          assert.throw(id.map.bind(id, any), 'Identity.map expects a function')
          assert.doesNotThrow(id.map.bind(id, identity))
        })
      )
    })
    it('obeys [fantasy-land/map] (identity) law', () => {
      // u['fantasy-land/map'](a => a) is equivalent to u (identity)
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))
          const id = Identity(any)

          id.map(identity)
          assert.equal(id.extract(), any)
        })
      )
    })
    it('fulfills the [fantasy/land map] spec (composition)', () => {
      // u['fantasy-land/map'](x => f(g(x))) is equivalent to u['fantasy-land/map'](g)['fantasy-land/map'](f) (composition)
      fc.assert(
        fc.property(fc.integer(), int => {
          const u = Identity(int)
          const f = x => x + x
          const g = x => x * x

          assert.equal(u.map(x => f(g(x))).extract(), u.map(g).map(f).extract())
        })
      )
    })
  })

  describe('Identity.extend', () => {
    it('expects a function argument', () => {
      fc.assert(
        fc.property(fc.anything(), any => {
          const id = Identity(any)
          assert.throw(
            id.extend.bind(id, any),
            'Identity.extend expects a function'
          )
          assert.doesNotThrow(id.extend.bind(id, identity))
        })
      )
    })
    it('fulfills the [fantasy/land extend] spec', () => {
      // w['fantasy-land/extend'](g)['fantasy-land/extend'](f) is equivalent to w['fantasy-land/extend'](_w => f(_w['fantasy-land/extend'](g)))
      fc.assert(
        fc.property(fc.integer(), int => {
          const id = Identity(int)
          const f = _id => _id.extract() + int
          const g = _id => _id.extract() * int

          assert.equal(
            id.extend(g).extend(f).extract(),
            id.extend(_id => f(_id.extend(g))).extract()
          )
        })
      )
    })
  })

  describe('Identity.extract', () => {
    it('obeys (left identity)', () => {
      // w['fantasy-land/extend'](_w => _w['fantasy-land/extract']()) is equivalent to w (left identity)
      fc.assert(
        fc.property(fc.integer(), x => {
          const w = Identity(x)
          assert.equal(w.extend(_w => _w.extract()).extract(), w.extract())
        })
      )
    })
    it('obeys (right identity)', () => {
      // w['fantasy-land/extend'](f)['fantasy-land/extract']() is equivalent to f(w)
      fc.assert(
        fc.property(fc.integer(), x => {
          const w = Identity(x)
          const f = _id => _id.extract() + x
          assert.equal(w.extend(f).extract(), f(w))
        })
      )
    })
  })

  describe('Identity.chain', () => {
    it('expects a function argument', () => {
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))

          const id = Identity(any)
          assert.throw(
            id.chain.bind(id, any),
            'Identity.chain expects a function'
          )
          assert.doesNotThrow(id.chain.bind(id, identity))
        })
      )
    })
    it('fulfills [fantasy-land/chain] spec (associativity)', () => {
      // m['fantasy-land/chain'](f)['fantasy-land/chain'](g) is equivalent to m['fantasy-land/chain'](x => f(x)['fantasy-land/chain'](g)) (associativity)
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (i1, i2) => {
          const m = Identity(i1)
          const f = x => Identity(x + i1)
          const g = x => Identity(x + i2)

          assert.equal(
            m.chain(f).chain(g).extract(),
            m.chain(x => f(x).chain(g)).extract()
          )
        })
      )
    })
  })

  describe('Identity.ap', () => {
    it('expects an Identity argument', () => {
      fc.assert(
        fc.property(fc.anything(), any => {
          const id = Identity(5)
          assert.throws(id.ap.bind(id, any), 'Identity.ap expects an Identity')
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
          const v = Identity(int1)
          const u = Identity(o_g)
          const a = Identity(o_f)
          assert.equal(
            v.ap(u.ap(a.map(composer))).extract(),
            v.ap(u).ap(a).extract()
          )
        })
      )
    })
  })

  describe('Identity.equals', () => {
    it('returns a boolean', function () {
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))
          const id = Identity(any)

          assert.isBoolean(id.equals(id))
        })
      )
    })
    it('returns false if not an Identity', function () {
      fc.assert(
        fc.property(fc.anything(), any => {
          const id = Identity(any)
          assert.isFalse(id.equals(any))
        })
      )
    })
    it('implements [fantasy-land/equals] spec (reflexivity)', function () {
      // a['fantasy-land/equals'](a) === true (reflexivity)
      fc.assert(
        fc.property(fc.anything(), fc.anything(), (any, any2) => {
          fc.pre(!isNaN(any))
          fc.pre(!isNaN(any2))
          fc.pre(any !== any2)
          const id = Identity(any)
          assert.isTrue(id.equals(id))
          assert.isFalse(id.equals(Identity.of(any2)))
        })
      )
    })
    it('implements [fantasy-land/equals] spec (symmetry)', function () {
      // a['fantasy-land/equals'](b) === b['fantasy-land/equals'](a) (symmetry)
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))
          const a = Identity(any)
          const b = Identity(any)

          assert.isTrue(a.equals(b) === b.equals(a))
        })
      )
    })
    it('implements [fantasy-land/equals] spec (transitivity)', function () {
      // If a['fantasy-land/equals'](b) and b['fantasy-land/equals'](c), then a['fantasy-land/equals'](c) (transitivity)
      fc.assert(
        fc.property(fc.integer(), int1 => {
          const a = Identity(int1)
          const b = Identity(int1)
          const c = Identity(int1)

          assert.equal(a.equals(b), b.equals(a))
          assert.isTrue(a.equals(c))
        })
      )
    })
  })
})
