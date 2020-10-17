const fc = require('fast-check')
const { expect, assert } = require('chai')
const sinon = require('sinon')
const { identity, isFunction, noop } = require('../helpers')
const IO = require('./IO')

describe('IO', () => {
  it('expects a function input', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        assert.throws(IO.bind(IO, any), 'IO expects a function')
      })
    )
  })
  it('has an is type method', () => {
    assert.isTrue(typeof IO.is === 'function')
  })
  it('returns an IO', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        const io = IO(() => any)
        assert.isTrue(IO.is(io))
      })
    )
  })
  it('has a run method', () => {
    assert.isTrue(typeof IO(() => 3).run === 'function')
  })
  it('has a map method', () => {
    assert.isTrue(typeof IO(() => 3).map === 'function')
  })
  it('has an ap method', () => {
    assert.isTrue(typeof IO(() => 3).ap === 'function')
  })
  it('has an of method', () => {
    assert.isTrue(typeof IO.of === 'function')
  })
  it('has a chain method', () => {
    assert.isTrue(typeof IO(() => 3).chain === 'function')
  })

  describe('IO.map', () => {
    it('expects a function as its argument', function () {
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))

          const io = IO(identity)
          assert.throw(io.map.bind(io, any), 'IO.map expects a function')
          assert.doesNotThrow(io.map.bind(io, identity))
        })
      )
    })
    it('fulfills the [fantasy/land map] spec (identity)', () => {
      // u['fantasy-land/map'](a => a)
      fc.assert(
        fc.property(fc.integer(), int => {
          const u = IO(() => int)

          assert.equal(u.map(identity).run(), int)
        })
      )
    })
    it('fulfills the [fantasy/land map] spec (composition)', () => {
      // u['fantasy-land/map'](x => f(g(x))) is equivalent to u['fantasy-land/map'](g)['fantasy-land/map'](f) (composition)
      fc.assert(
        fc.property(fc.integer(), int => {
          const u = IO(() => int)
          const f = x => x + x
          const g = x => x * x

          assert.equal(u.map(x => f(g(x))).run(), u.map(g).map(f).run())
        })
      )
    })
  })

  describe('IO.ap', () => {
    it('expects an IO argument', () => {
      fc.assert(
        fc.property(fc.anything(), any => {
          const io = IO(() => any)

          assert.throws(io.ap.bind(io, any), 'IO.ap expects an IO')
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
          const v = IO(() => int1)
          const u = IO(() => o_g)
          const a = IO(() => o_f)
          assert.equal(v.ap(u.ap(a.map(composer))).run(), v.ap(u).ap(a).run())
        })
      )
    })
  })

  describe('IO.of', () => {
    it('lifts some input into IO', () => {
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))
          const io = IO.of(any)

          assert.equal(io.run(), any)
        })
      )
    })
    it('implements [fantasy-land/of] spec (identity)', () => {
      // v['fantasy-land/ap'](A['fantasy-land/of'](x => x)) is equivalent to v (identity)
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))
          const v = IO(() => any)

          assert.equal(v.ap(IO.of(identity)).run(), any)
        })
      )
    })
    it('implements [fantasy-land/of] spec (homomorphism)', () => {
      // A['fantasy-land/of'](x)['fantasy-land/ap'](A['fantasy-land/of'](f)) is equivalent to A['fantasy-land/of'](f(x)) (homomorphism)
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))

          assert.equal(
            IO.of(any).ap(IO.of(identity)).run(),
            IO.of(identity(any)).run()
          )
        })
      )
    })
    it('implements [fantasy-land/of] spec (interchange)', () => {
      // A['fantasy-land/of'](y)['fantasy-land/ap'](u) is equivalent to u['fantasy-land/ap'](A['fantasy-land/of'](f => f(y))) (interchange)
      fc.assert(
        fc.property(fc.integer(), y => {
          fc.pre(!isNaN(y))
          const u = IO(() => identity)

          assert.equal(IO.of(y).ap(u).run(), u.ap(IO.of(f => f(y))).run())
        })
      )
    })
  })

  describe('IO.chain', () => {
    it('expects a function argument that returns an IO', () => {
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))

          const c = IO(() => any)
          const f = () => IO(() => any)
          const g = () => any
          assert.throws(c.chain.bind(c, any), 'IO.chain expects a function')
          assert.throws(c.chain.bind(c, g), 'argument must return an IO')
          assert.doesNotThrow(c.chain.bind(c, f))
        })
      )
    })
    it('implements [fantasy-land/chain] spec (associativity)', () => {
      // m['fantasy-land/chain'](f)['fantasy-land/chain'](g) is equivalent to m['fantasy-land/chain'](x => f(x)['fantasy-land/chain'](g)) (associativity)
      fc.assert(
        fc.property(fc.integer(), int => {
          const f = x => IO(() => int + x)
          const g = x => IO(() => x * int)
          const m = IO(() => int)

          assert.equal(
            m.chain(f).chain(g).run(),
            m.chain(x => f(x).chain(g)).run()
          )
        })
      )
    })
  })
})
