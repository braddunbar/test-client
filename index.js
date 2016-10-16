'use strict'

const http = require('http')
const Request = require('./request')

class Client {

  constructor (app) {
    this.app = app
  }

  request (path, method) {
    return new Request(this.app, path, method)
  }

}

for (const method of http.METHODS) {
  Client.prototype[method.toLowerCase()] = function (path) {
    return this.request(path, method)
  }
}

module.exports = Client
