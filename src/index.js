const { freeze } = require('./helpers')

const Wrappers = {
  Identity: require('./Identity/Identity'),
  IO: require('./IO/IO'),
  Task: require('./Task/Task'),
}

module.exports = freeze(Wrappers)
