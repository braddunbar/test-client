'use strict'

const assert = require('assert')
const util = require('util')

// Template tag that inspects all values.
const inspect = (literals, ...values) => {
  let i = 0
  let result = ''
  for (const value of values) {
    result += literals.raw[i++]
    result += util.inspect(value)
  }
  return result + literals.raw[i]
}

class Response {

  constructor (status, headers, body) {
    this.status = status
    this.headers = headers
    this.body = /json/.test(this.headers['content-type'])
      ? JSON.parse(body)
      : body
  }

  expect (...args) {
    if (typeof args[0] === 'number') {
      this.expectStatus(args[0])
      if (args.length > 1) this.expectBody(args[1])

    } else if (args.length > 1) {
      this.expectHeader(args[0], args[1])

    } else if (args.length > 0) {
      this.expectBody(args[0])
    }

    return this
  }

  expectBody (body) {
    if (body instanceof RegExp) {
      const message = inspect`expected ${this.body} to match ${body}`
      assert.ok(body.test(this.body), message)
    } else {
      const message = inspect`expected ${body}, got ${this.body}`
      assert.deepStrictEqual(body, this.body, message)
    }
  }

  expectStatus (status) {
    const message = inspect`expected ${status}, got ${this.status}`
    assert.strictEqual(status, this.status, message)
  }

  expectHeader (key, value) {
    const actual = this.headers[key.toLowerCase()]
    if (value instanceof RegExp) {
      const message = inspect`expected ${key} of ${actual} to match ${value}`
      assert.ok(value.test(actual), message)
    } else {
      assert.notStrictEqual(actual, undefined, inspect`expected ${key} header`)
      assert.strictEqual(value, actual, inspect`expected ${key} of ${value}, got ${actual}`)
    }
  }

}

module.exports = Response
