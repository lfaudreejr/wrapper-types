const fc = require('fast-check')
const { expect, assert } = require('chai')
const sinon = require('sinon')
const { identity, isFunction, noop } = require('../helpers')
const IO = require('./IO')
const { spy } = require('sinon')

describe('IO', () => {
  it('is a function', () => {
    assert.isTrue(isFunction(IO))
  })
  it('wraps a function', () => {
    assert.throws(IO, 'IO must wrap function')
    assert.throws(IO.bind(IO, 3), 'IO must wrap function')
  })
  it('returns an object', () => {
    assert.isObject(IO(identity))
  })
  it('has type of "IO"', () => {
    assert.isTrue(IO.type === 'IO')
  })
  it('has an "@@type" of "IO"', () => {
    assert.isTrue(IO['@@type'] === 'IO')
  })
  it('returns a sealed (frozen) object', () => {
    assert.sealed(IO(identity))
  })
})

describe('IO.run', () => {
  it('it calls the wrapped functon', () => {
    const spy = sinon.spy()
    const io = IO(spy)

    io.run()

    assert.isTrue(spy.called)
  })
})

describe('IO.map', () => {
  it('expects a function argument', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        const map = IO(() => any).map
        assert.throw(map, 'IO.map must wrap function')
      })
    )
  })
  it('returns an IO', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        expect(IO(identity).map(identity).type).to.equal(IO.type)
      })
    )
  })
  it('is a Functor implementing [fantasy-land/map]', () => {
    fc.assert(
      fc.property(fc.string(), str => {
        // identity
        assert.equal(
          IO(() => str)
            .map(identity)
            .run(),
          str
        )
        // composition
        const f = s => s.toUpperCase()
        const g = s => s + '!!!'
        assert.equal(
          IO(() => str)
            .map(x => f(g(x)))
            .run(),
          IO(() => str)
            .map(g)
            .map(f)
            .run()
        )
      })
    )
  })
})

describe('IO.ap', () => {
  it('fails if return of wrapped value of IO is not a function', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        const bad = IO(() => any).ap(IO.of(any))
        const good = IO(() => identity).ap(IO.of(any))

        assert.throws(bad.run)
        assert.doesNotThrow(good.run)
      })
    )
  })
  it('expects an IO as argument', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        const io = IO(identity)
        assert.throws(io.ap.bind(io, any))
        assert.doesNotThrow(
          io.ap.bind(
            io,
            IO(() => any)
          )
        )
      })
    )
  })
  it('is an Apply implementing [fantasy-land/ap]', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        fc.pre(!isNaN(any))

        // composition
        const io = IO(() => identity)
        const compose = f => g => x => f(g(x))

        const one = io.map(compose).ap(io).ap(io).ap(IO.of(any))
        const two = io.ap(io.ap(io)).ap(IO.of(any))

        assert.equal(one.run(), two.run())
      })
    )
  })
})

describe('IO.chain', () => {
  it('is a function', () => {
    assert.isTrue(isFunction(IO(identity).chain))
  })
  it('expects function argument', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        assert.throws(
          IO(identity).chain.bind(IO, any),
          'IO.chain must wrap function'
        )
        assert.doesNotThrow(IO(identity).chain.bind(IO, () => {}))
      })
    )
  })
  it('passed function must return an IO', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        const io = IO(() => any)
        const badFake = () => any
        const goodFake = () => IO(identity)

        assert.throws(io.chain(badFake).run.bind(io), 'IO.chain must return IO')
        assert.doesNotThrow(io.chain(goodFake).run.bind(io))
      })
    )
  })
  it('implements Chain [fantasy-land/chain]', () => {
    fc.assert(
      fc.property(fc.string(), str => {
        const io = IO(() => str)
        const f = str => IO(() => str.toUpperCase())
        const g = str => IO(() => str + '!!!')

        assert.isTrue(isFunction(io.ap))

        assert.equal(
          io.chain(f).chain(g).run(),
          io
            .chain(x => f(x))
            .chain(g)
            .run()
        )
      })
    )
  })
})

describe('IO.concat', () => {
  it('is a function', () => {
    assert.isTrue(isFunction(IO(identity).concat))
  })
  it('expects an IO as argument', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        assert.throws(IO(() => any).concat.bind(IO, any))
        assert.doesNotThrow(IO(() => any).concat.bind(IO, IO(identity)))
      })
    )
  })
  it('is a Semigroup implementing [fantasy-land/concat]', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer(), (str, int) => {
        // associativity
        const one = IO(() => str)

        assert.equal(
          one.concat(IO.of(str)).concat(IO.of(str)).run(),
          one.concat(IO.of(str).concat(IO.of(str))).run()
        )

        const two = IO(() => int)

        assert.equal(
          two.concat(IO.of(int)).concat(IO.of(int)).run(),
          two.concat(IO.of(int).concat(IO.of(int))).run()
        )
      })
    )
  })
})

describe('IO.of', () => {
  it('returns an IO', () => {
    assert.isTrue(IO.of(4).type === IO.type)
  })
  it('is same type as instance', () => {
    assert.equal(IO.of, IO(noop).of)
  })
  it('is an Applicative implementing [fantasy-land/of]', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        fc.pre(!isNaN(any))

        // identity
        const io = IO.of(identity)

        assert.equal(io.ap(IO.of(any)).run(), any)

        // homomorphism
        const f = () => any

        assert.equal(
          IO.of(f).ap(IO.of(identity)).run(),
          IO.of(f(identity)).run()
        )

        // interchange
        assert.equal(
          IO.of(identity).ap(IO.of(any)).run(),
          IO.of(f => f(any))
            .ap(IO.of(identity))
            .run()
        )
      })
    )
  })
})
