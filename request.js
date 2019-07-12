'use strict'

const Stream = require('stream')
const fetch = require('node-fetch')
const Response = require('./response')
const mimeTypes = require('mime-types')

class Request {
  constructor (client, method, path) {
    this.client = client
    this.path = path
    this.method = method
    this.headers = {}
  }

  async send (body) {
    if (body != null && !(body instanceof Stream) && typeof body !== 'string') {
      this.type('json')
      body = JSON.stringify(body)
    }

    this.headers.cookie = this.client.cookie

    const server = await this.client.server()
    const { port } = server.address()

    try {
      const response = await fetch(`http://localhost:${port}${this.path}`, {
        body,
        method: this.method,
        headers: this.headers
      })

      this.client.cookie = response.headers.get('set-cookie')

      const data = /json/.test(response.headers.get('content-type'))
        ? await response.json()
        : await response.text()

      return new Response(response.status, response.headers, data)
    } finally {
      server.close()
    }
  }

  set (...args) {
    if (args.length === 2) {
      const [key, value] = args
      this.headers[key] = value
    } else if (args.length === 1) {
      const [headers] = args
      Object.assign(this.headers, headers)
    }
    return this
  }

  accept (type) {
    this.set('accept', mimeTypes.contentType(type))
    return this
  }

  type (type) {
    this.set('content-type', mimeTypes.contentType(type))
    return this
  }
}

module.exports = Request
