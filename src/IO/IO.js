const { freeze, isFunction } = require('../helpers')

const type = 'IO'
const typeFn = () => type

const _of = IO

function IO(run) {
  if (!isFunction(run)) throw new TypeError('IO must wrap a function')

  return freeze({})
}

IO.of = _of
IO.type = typeFn
IO['@@type'] = type

module.exports = IO
