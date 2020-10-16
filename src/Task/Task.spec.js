const fc = require('fast-check')
const { expect, assert } = require('chai')
const sinon = require('sinon')
const { applyFnTo, identity, noop } = require('../helpers')
const Task = require('./Task')

describe('Task', () => {
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('expects a function argument', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        assert.throws(Task.bind(Task, any), 'Task expects a function')
      })
    )
  })
  it('has an is method', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        assert.isTrue(typeof Task.is === 'function')
      })
    )
  })
  it('returns a task', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        assert.isTrue(Task.is(Task(() => {})))
      })
    )
  })
  it('has a fork method', () => {
    assert.isTrue(typeof Task(() => {}).fork === 'function')
  })
  it('has a map method', () => {
    assert.isTrue(typeof Task(() => {}).map === 'function')
  })
  it('has an ap method', () => {
    assert.isTrue(typeof Task(() => {}).ap === 'function')
  })
  it('has an of method', () => {
    assert.isTrue(typeof Task.of === 'function')
  })
  it('has a chain method', () => {
    assert.isTrue(typeof Task(() => {}).chain === 'function')
  })

  describe('Task.fork', () => {
    it('expects two function arguments', () => {
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))

          const task = Task(() => any)

          assert.throws(
            task.fork.bind(task, any),
            'fork expects two function arguments'
          )
          assert.throws(
            task.fork.bind(task, () => {}),
            'fork expects two function arguments'
          )
          assert.doesNotThrow(
            task.fork.bind(
              task,
              () => {},
              () => {}
            )
          )
        })
      )
    })
    it('will call reject when forked if reject is returned', done => {
      const hasFailed = 'has failed'
      const failFn = sandbox.fake()
      const successFn = sandbox.fake()
      const task = Task((rej, res) => rej(hasFailed))

      task.fork(failFn, successFn)

      expect(failFn.calledWith(hasFailed)).to.be.true
      expect(successFn.called).to.be.false

      done()
    })
    it('will call the resolve function passed to fork if resolved', done => {
      const hasSucceeded = 'has succeeded'
      const failFn = sandbox.fake()
      const successFn = sandbox.fake()
      const task = Task((rej, res) => res(hasSucceeded))

      task.fork(failFn, successFn)

      expect(successFn.calledWith(hasSucceeded)).to.be.true
      expect(failFn.called).to.be.false

      done()
    })
  })

  describe('Task.map', () => {
    it('expects a function argument', () => {
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))

          const task = Task.of(any)
          assert.throws(task.map.bind(this, any), 'Task.map expects a function')
        })
      )
    })
  })
  it('returns a Task', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        fc.pre(!isNaN(any))
        const task = Task.of(any)
        const spy = sandbox.spy(task, 'map')
        task.map(identity)

        assert.isTrue(Task.is(spy.returnValues[0]))
      })
    )
  })
  it('fulfills the [fantasy/land map] spec (identity)', done => {
    // u['fantasy-land/map'](a => a) equals u
    fc.assert(
      fc.property(fc.integer(), int => {
        const fake = sandbox.fake()

        const task = Task.of(int)

        task.map(identity).fork(noop, identity)

        expect(fake.returned(int))
      })
    )
    done()
  })
  it('fulfills the [fantasy/land map] spec (composition)', done => {
    // u['fantasy-land/map'](x => f(g(x))) is equivalent to u['fantasy-land/map'](g)['fantasy-land/map'](f) (composition)
    fc.assert(
      fc.property(fc.integer(), int => {
        const f = x => x + 1
        const g = x => x * 2
        const composer = f => g => x => f(g(x))
        const successFnOne = sinon.fake()
        const successFnTwo = sinon.fake()
        const u = Task((rej, res) => res(int))

        u.map(composer).fork(noop, successFnOne)
        u.map(g).map(f).fork(noop, successFnTwo)

        assert.equal(successFnOne.returnValues[0], successFnTwo.returnValues[0])
      })
    )
    done()
  })

  describe('Task.ap', () => {
    it('expects a Task argument', done => {
      fc.assert(
        fc.property(fc.anything(), any => {
          const task = Task.of(any)

          assert.throws(task.ap.bind(task, any), 'Task.ap expects a Task')
        })
      )
      done()
    })
    it('it [fantasy-land/ap] (composition)', done => {
      // v['fantasy-land/ap'](u['fantasy-land/ap'](a['fantasy-land/map'](f => g => x => f(g(x))))) is equivalent to v['fantasy-land/ap'](u)['fantasy-land/ap'](a) (composition)
      fc.assert(
        fc.property(fc.integer(), int => {
          const composer = f => g => x => f(g(x))
          const v = Task.of(int)
          const u = Task.of(identity)
          const a = Task.of(identity)

          const successOne = sandbox.spy()
          const successTwo = sandbox.spy()

          v.ap(u.ap(a.map(composer))).fork(noop, successOne)
          v.ap(u).ap(a).fork(noop, successTwo)

          assert.equal(successOne.args[0][0], successTwo.args[0][0])
        })
      )

      done()
    })
  })

  describe('Task.chain', () => {
    it('expects a function argument', () => {
      fc.assert(
        fc.property(fc.anything(), any => {
          fc.pre(!isNaN(any))

          const task = Task.of(any)

          assert.throws(
            task.chain.bind(task, any),
            'Task.chain expects a function'
          )
        })
      )
    })
    it('returns a Task', () => {
      fc.assert(
        fc.property(fc.anything(), any => {
          const task = Task.of(any)
          const spy = sinon.spy(task, 'chain')

          task.chain(() => Task.of(any))

          assert.isTrue(Task.is(spy.returnValues[0]))
        })
      )
    })

    it('applies chains together two Tasks and removes a Task layer', done => {
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (int1, int2) => {
          const t1 = Task.of(1)
          const t2 = Task.of(2)
          const successFake = sandbox.fake()

          t1.chain(x => {
            return t2.map(v => {
              return v + x
            })
          }).fork(noop, successFake)

          const sum = 1 + 2

          assert.equal(sum, successFake.args[0][0])
        })
      )
      done()
    })
  })
})
