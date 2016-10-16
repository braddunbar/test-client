'use strict'

const http = require('http')
const mimeTypes = require('mime-types')
const Response = require('./response')
const {CookieAccessInfo} = require('cookiejar')

class Request {

  constructor (app, jar, path, method) {
    this.app = app
    this.jar = jar
    this.path = path
    this.method = method
    this.headers = {}
  }

  listen () {
    return new Promise((resolve, reject) => {
      const server = this.app.listen()
      server.on('listening', () => resolve(server))
      server.on('error', reject)
    })
  }

  send (body) {
    if (body !== undefined && typeof body !== 'string') {
      this.type('json')
      body = JSON.stringify(body)
    }

    const access = new CookieAccessInfo('localhost', '/')
    this.headers.cookie = this.jar.getCookies(access).toValueString()

    return this.listen().then((server) => new Promise((resolve, reject) => {
      const {family, port} = server.address()
      const request = http.request({
        family: family === 'IPv6' ? 6 : 4,
        headers: this.headers,
        method: this.method,
        path: this.path,
        port
      })

      request.on('response', (response) => {
        let body = ''
        const {headers, statusCode} = response

        response.setEncoding('utf8')
        response.on('data', (chunk) => body += chunk.toString())
        response.on('end', () => {
          server.close()
          this.jar.setCookies(headers['set-cookie'] || [], 'localhost', '/')
          resolve(new Response(statusCode, headers, body))
        })
      })

      request.on('error', (error) => {
        server.close()
        reject(error)
      })

      request.end(body)
    }))
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
