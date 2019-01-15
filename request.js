'use strict'

const http = require('http')
const Stream = require('stream')
const mimeTypes = require('mime-types')
const Response = require('./response')
const { CookieAccessInfo } = require('cookiejar')

const send = (options, body) => new Promise((resolve, reject) => {
  const request = http.request(options, (response) => {
    let body = ''
    const { headers, statusCode } = response

    response.on('data', (chunk) => {
      body += chunk.toString()
    })

    response.on('end', () => {
      // If the body is JSON, go ahead and parse it.
      if (/json/.test(headers['content-type'])) {
        try { body = JSON.parse(body) } catch (error) { reject(error) }
      }
      resolve(new Response(statusCode, headers, body))
    })
  })

  request.on('error', reject)

  if (body instanceof Stream) {
    body.pipe(request)
  } else {
    request.end(body)
  }
})

class Request {
  constructor (app, jar, path, method) {
    this.app = app
    this.jar = jar
    this.path = path
    this.method = method
    this.headers = {}
  }

  async send (body) {
    // JSON encode the body if appropriate.
    if (body != null && !(body instanceof Stream) && typeof body !== 'string') {
      this.type('json')
      body = JSON.stringify(body)
    }

    // Send all the cookies in the jar.
    const access = new CookieAccessInfo('localhost', '/')
    this.headers.cookie = this.jar.getCookies(access).toValueString()

    const server = await new Promise((resolve, reject) => {
      const server = this.app.listen(() => resolve(server))
      server.on('error', reject)
    })

    try {
      const { family, port } = server.address()
      const response = await send({
        family: family === 'IPv6' ? 6 : 4,
        headers: this.headers,
        method: this.method,
        path: this.path,
        port
      }, body)

      // Save cookies for subsequent requests.
      const cookies = response.headers['set-cookie']
      this.jar.setCookies(cookies || [], 'localhost', '/')

      return response
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
