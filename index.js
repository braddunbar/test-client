'use strict'

const http = require('http')
const Request = require('./request')
const { CookieJar } = require('cookiejar')

class Client {
  constructor (app) {
    this.app = app
    this.jar = new CookieJar()
  }

  request (path, method) {
    return new Request(this.app, this.jar, path, method)
  }
}

for (const method of http.METHODS) {
  Client.prototype[method.toLowerCase()] = function (path) {
    return this.request(path, method)
  }
}

module.exports = Client
