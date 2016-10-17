'use strict'

const http = require('http')
const mimeTypes = require('mime-types')
const Response = require('./response')
const {CookieAccessInfo} = require('cookiejar')

const listen = (app) => new Promise((resolve, reject) => {
  const server = app.listen()
  server.on('listening', () => resolve(server))
  server.on('error', reject)
})

const send = (options, body) => new Promise((resolve, reject) => {
  const request = http.request(options, (response) => {
    let body = ''
    const {headers, statusCode} = response

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
  request.end(body)
})

class Request {

  constructor (app, jar, path, method) {
    this.app = app
    this.jar = jar
    this.path = path
    this.method = method
    this.headers = {}
  }

  send (body) {
    // JSON encode the body if appropriate.
    if (body !== undefined && typeof body !== 'string') {
      this.type('json')
      body = JSON.stringify(body)
    }

    // Send all the cookies in the jar.
    const access = new CookieAccessInfo('localhost', '/')
    this.headers.cookie = this.jar.getCookies(access).toValueString()

    return listen(this.app).then((server) => {
      const {family, port} = server.address()

      return send({
        family: family === 'IPv6' ? 6 : 4,
        headers: this.headers,
        method: this.method,
        path: this.path,
        port
      }, body)

      .then((response) => {
        server.close()

        // Save cookies for subsequent requests.
        const cookies = response.headers['set-cookie']
        this.jar.setCookies(cookies || [], 'localhost', '/')

        return response
      })

      .catch((error) => {
        server.close()
        throw error
      })
    })
  }

  set (key, value) {
    this.headers[key] = value
    return this
  }

  type (type) {
    this.set('content-type', mimeTypes.contentType(type))
    return this
  }

}

module.exports = Request
