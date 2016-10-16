'use strict'

const co = require('co')
const tape = require('tape')

module.exports = (name, test) => {
  tape(name, (assert) => co(function *() {
    try {
      yield co(test, assert)
      assert.end()
    } catch (error) {
      assert.end(error)
    }
  }))
}
