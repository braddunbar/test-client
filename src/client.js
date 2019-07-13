'use strict'

const http = require('http')
const Request = require('./request.js')
const { CookieAccessInfo, CookieJar } = require('cookiejar')

class Client {
  constructor (app) {
    this.app = app
    this.jar = new CookieJar()
  }

  request ({ method, path }) {
    return new Request({ client: this, method, path })
  }

  get cookie () {
    const access = new CookieAccessInfo('localhost', '/')
    return this.jar.getCookies(access).toValueString()
  }

  set cookie (value) {
    this.jar.setCookies(value || [], 'localhost', '/')
  }
}

for (const method of http.METHODS) {
  Client.prototype[method.toLowerCase()] = function (path) {
    return this.request({ method, path })
  }
}

module.exports = Client
