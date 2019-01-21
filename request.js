'use strict'

const http = require('http')
const Stream = require('stream')
const mimeTypes = require('mime-types')
const Response = require('./response')

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
    const { family, port } = server.address()

    try {
      const response = await new Promise((resolve, reject) => {
        const request = http.request({
          family: family === 'IPv6' ? 6 : 4,
          headers: this.headers,
          method: this.method,
          path: this.path,
          port
        }, resolve)

        request.on('error', reject)

        if (body instanceof Stream) {
          body.pipe(request)
        } else {
          request.end(body)
        }
      })

      this.client.cookie = response.headers['set-cookie']

      let data = Buffer.alloc(0)
      for await (const chunk of response) data = Buffer.concat([data, chunk])
      data = data.toString()

      if (/json/.test(response.headers['content-type'])) {
        data = JSON.parse(data)
      }

      return new Response(response.statusCode, response.headers, data)
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
