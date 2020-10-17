![Node.js Package](https://github.com/lfaudreejr/wrapper-types/workflows/Node.js%20Package/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/lfaudreejr/wrapper-types/badge.svg?branch=master)](https://coveralls.io/github/lfaudreejr/wrapper-types?branch=master)

# Wrapper-Types


## Installation

```bash
npm install wrapper-types
```

## Usage

Require the whole module:

```javascript
const wrappers = require('wrapper-types')
```

Require types individually:

```javascript
const { IO, Identity } = require('wrapper-types')
```


### Identity
```javascript
const { identity } = require('wrapper-types')

const identity = Identity.of(2)
```

> Methods: map, chain, ap, extend, extract, equals, of, is, toString

### IO
```javascript
const { IO } = require('wrapper-types')

const io = IO.of(window)
```

> Methods: map, chain, ap, run, of, is, toString


### Maybe
```javascript
const { Maybe } = require('wrapper-types')

const maybe = Maybe.of(2)
```

> Methods: map, chain, ap, extend, extract, isNothing, of, is, toString

### Task
```javascript
const { Task } = require('wrapper-types')

const task = Task((rej, res) => doAsync().then(res).catch(rej))
```

> Methods: map, chain, ap, fork, of, is, toString


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)