'use strict'

const assert = require('assert')
const util = require('util')
const { Headers } = require('node-fetch')

// Template tag that inspects all values.
const inspect = (literals, ...values) => {
  let i = 0
  let result = ''
  for (const value of values) {
    result += literals.raw[i++] + util.inspect(value)
  }
  return result + literals.raw[i]
}

class Response {
  constructor ({ status = 200, headers, body } = {}) {
    this.status = status
    this.headers = headers instanceof Headers ? headers : new Headers(headers)
    this.body = body
  }

  assert (...args) {
    if (args.length === 1) {
      if (typeof args[0] === 'number') {
        this.assertStatus(args[0])
      } else {
        this.assertBody(args[0])
      }
      return this
    }

    if (args.length === 2) {
      if (typeof args[0] === 'number') {
        this.assertStatus(args[0])
        this.assertBody(args[1])
      } else {
        this.assertHeader(args[0], args[1])
      }
      return this
    }

    throw new Error('Response#assert accepts one or two arguments')
  }

  assertBody (body) {
    if (body instanceof RegExp) {
      const message = inspect`expected ${this.body} to match ${body}`
      assert.ok(body.test(this.body), message)
    } else {
      const message = inspect`expected ${body}, got ${this.body}`
      assert.deepStrictEqual(body, this.body, message)
    }
  }

  assertStatus (status) {
    const message = inspect`expected ${status}, got ${this.status}`
    assert.strictEqual(status, this.status, message)
  }

  assertHeader (key, value) {
    const actual = this.headers.get(key.toLowerCase())
    if (value instanceof RegExp) {
      const message = inspect`expected ${key} of ${actual} to match ${value}`
      assert.ok(value.test(actual), message)
    } else {
      assert.strictEqual(value, actual, inspect`expected ${key} of ${value}, got ${actual}`)
    }
  }
}

module.exports = Response
