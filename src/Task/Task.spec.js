const fc = require('fast-check')
const { expect, assert } = require('chai')
const sinon = require('sinon')
const { applyFnTo, identity, noop } = require('../helpers')
const Task = require('./Task')

describe('Task', () => {
  it('is a function', function () {
    expect(Task).to.be.a.instanceof(Function)
  })
  it('expects a function as its argument', function () {
    expect(Task).to.throw
    expect(Task(identity)).to.not.throw
  })
  it('will throw an error if not given a value', function () {
    expect(Task).to.throw()
  })
  it('returns an object', function () {
    assert.isObject(Task(() => {}))
  })
  it('has type of "Task"', function () {
    assert.equal(Task.type(), 'Task')
  })
  it('has @@type of "Task"', function () {
    assert.equal(Task['@@type'], 'Task')
  })
  it('is sealed (frozen)', function () {
    expect(Task(() => {})).to.be.sealed
  })
  it('implements the Monad spec (left identity, right identity)', function () {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (intOne, intTwo) => {
        const f = x => Task.of(x + intOne)
        const leftSuccess = sinon.spy()
        const rightSuccess = sinon.spy()

        // left identity
        Task.of(intOne).chain(f).fork(noop, leftSuccess)
        f(intOne).fork(noop, rightSuccess)

        assert.equal(leftSuccess.args[0][0], rightSuccess.args[0][0])

        // right identity
      })
    )
  })
})

describe('Task.fork', () => {
  it('expects two functions as its arguments', () => {
    const task = Task(() => {})
    const fn = () => {}
    const exception = 'Task.fork (reject, resolve) must be functions'
    expect(task.fork.bind(task, fn)).to.throw(exception)
    expect(task.fork.bind(task, 1)).to.throw(exception)
    expect(task.fork.bind(task, 'str')).to.throw(exception)
    expect(task.fork.bind(task, false)).to.throw(exception)
    expect(task.fork.bind(task, undefined)).to.throw(exception)
    expect(task.fork.bind(task, {})).to.throw(exception)
    expect(task.fork.bind(task, 2)).to.throw(exception)
    expect(task.fork.bind(task, fn, fn)).to.not.throw(exception)
  })
  it('will call reject when forked if reject is returned', done => {
    const hasFailed = 'has failed'
    const failFn = sinon.fake()
    const successFn = sinon.fake()
    const task = Task((rej, res) => rej(hasFailed))

    task.fork(failFn, successFn)

    expect(failFn.calledWith(hasFailed)).to.be.true
    expect(successFn.called).to.be.false

    done()
  })
  it('will call the resolve function passed to fork if resolved', done => {
    const hasSucceeded = 'has succeeded'
    const failFn = sinon.fake()
    const successFn = sinon.fake()
    const task = Task((rej, res) => res(hasSucceeded))

    task.fork(failFn, successFn)

    expect(successFn.calledWith(hasSucceeded)).to.be.true
    expect(failFn.called).to.be.false

    done()
  })
})

describe('Task.map', () => {
  it('must have a function argument', () => {
    const task = Task((rej, res) => res('resolve'))
    expect(task.map.bind(task, 3)).to.throw(
      'Task.map expects function argument'
    )
  })
  it('returns a Task', () => {
    const type = Task((rej, res) => res(1))
      .map(identity)
      .type()
    expect(type).to.equal(Task.type())
  })
  it('calls map when resolved and does not call when rejected', done => {
    const mapFn = sinon.fake()
    const successFn = sinon.fake()
    const failFn = sinon.fake()
    const successStr = 'success'
    const failStr = 'failed'

    Task((rej, res) => res(successStr))
      .map(mapFn)
      .fork(failFn, successFn)

    Task((rej, res) => rej(failStr))
      .map(mapFn)
      .fork(failFn, successFn)

    expect(mapFn.calledWith(successStr)).to.be.true
    expect(mapFn.calledWith(failStr)).to.not.be.true

    done()
  })
  it('implements Functor [fantasy-land/map]', done => {
    const addOne = x => x + 1
    const timesTwo = x => x * 2
    const addOneThenTimesTwo = x => timesTwo(addOne(x))
    const x = 1

    // (identity) task(x).map(x => x) == task(x)
    const successFn = sinon.fake()

    Task((rej, res) => res(x))
      .map(identity)
      .fork(noop, successFn)

    expect(successFn.returned(x))

    // (compostion) task(x).map(x => f(g(x))) == task(x).map(g).map(f)
    const successFnOne = sinon.fake()
    const successFnTwo = sinon.fake()

    Task((rej, res) => res(x))
      .map(addOneThenTimesTwo)
      .fork(noop, successFnOne)
    Task((rej, res) => res(x))
      .map(addOne)
      .map(timesTwo)
      .fork(noop, successFnTwo)

    assert.equal(successFnOne.returnValues[0], successFnTwo.returnValues[0])

    done()
  })
})

describe('Task.ap', () => {
  it('fails if wrapped value of Apply is not a function', done => {
    const task = Task.of(3)
    const fail = sinon.fake()
    const success = sinon.fake()

    assert.throws(task.ap(task).fork.bind(task, fail, success))
    assert.doesNotThrow(
      Task.of(identity).ap(Task.of(2)).fork.bind(null, fail, success)
    )

    done()
  })
  it('implements Apply [fantasy-land/ap]', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        fc.pre(!isNaN(any))
        // composition
        const composer = f => g => x => f(g(x))
        const task = Task.of(identity)

        const successOne = sinon.spy()
        const successTwo = sinon.spy()

        task
          .map(composer)
          .ap(task)
          .ap(task)
          .ap(Task.of(any))
          .fork(noop, successOne)
        task.ap(task.ap(task)).ap(Task.of(any)).fork(noop, successTwo)

        assert.equal(successOne.args[0][0], successTwo.args[0][0])
      })
    )
  })
})

describe('Task.of', () => {
  it('returns a Task', () => {
    assert.isTrue(Task.of(5).type() === Task.type())
  })
  it('has same type as instance', () => {
    assert.equal(Task.of, Task(noop).of)
  })
  it('implements Applicative [fantasy-land/of]', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        fc.pre(!isNaN(any))
        // identity
        const success = sinon.spy()
        Task.of(identity).ap(Task.of(any)).fork(noop, success)
        assert.isTrue(success.calledWith(any))

        // homomorphism
        const successOne = sinon.spy()
        const successTwo = sinon.spy()
        Task.of(identity).ap(Task.of(any)).fork(noop, successOne)
        Task.of(identity(any)).fork(noop, successTwo)
        assert.equal(successOne.args[0][0], successTwo.args[0][0])

        // interchange
        const successThree = sinon.spy()
        const successFour = sinon.spy()
        Task.of(identity).ap(Task.of(any)).fork(noop, successThree)
        Task.of(fn => fn(any))
          .ap(Task.of(identity))
          .fork(noop, successFour)
        assert.equal(successOne.args[0][0], successTwo.args[0][0])
      })
    )
  })
})

describe('Task.chain', () => {
  it('returns a Task', () => {
    assert.isTrue(
      Task.of(5)
        .chain(x => Task.of(2))
        .type() === Task.type()
    )
  })
  it('takes one argument that is a function', () => {
    fc.assert(
      fc.property(fc.anything(), any => {
        const task = Task.of(any)

        assert.throws(task.chain.bind(task, any))
        assert.doesNotThrow(task.chain.bind(task, identity))
      })
    )
  })
  it('implements Chain [fantasy-land/chain]', () => {
    // associativity
    const successOne = sinon.spy()
    const successTwo = sinon.spy()

    const f = x => Task((rej, res) => res(x + 1))
    const g = x => Task((rej, res) => res(x * 2))
    const x = 2

    Task((rej, res) => res(x))
      .chain(f)
      .chain(g)
      .fork(noop, successOne)
    Task((rej, res) => res(x))
      .chain(x => f(x))
      .chain(g)
      .fork(noop, successTwo)
    assert.equal(successOne.args[0][0], successTwo.args[0][0])
  })
})
