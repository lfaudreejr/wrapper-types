const { freeze } = require('./helpers')

const Wrappers = {
  Identity: require('./Identity'),
  IO: require('./IO'),
  Task: require('./Task'),
}

module.exports = freeze(Wrappers)
