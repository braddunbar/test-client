# test-client

`test-client` is a small HTTP assertion library that uses promises, enabling
tests to be written with[`co`][co] generators and `async`/`await`.

```js
'use strict'

const co = require('co')
const http = require('http')
const Client = require('test-client')

co(function *() {
  const server = http.createServer((request, response) => {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({x: 2}))
  })

  const client = new Client(server)

  const response = yield client
    .get('/test')
    .type('json')
    .accept('json')
    .set('user-agent', 'smith')
    .send({x: 1})

  response
    .assert(200, {x: 2})
    .assert('content-type', /json/)
})
```

# API

## Client

### new Client(app)

`app` can be a [koa][koa]/[express][express] app, an `http.Server`, or anything
with a `.listen()` method.

### .request(path, method)

Returns a `Request` with the corresponding `path` and `method`. `method` can be
any of the values in `http.METHODS`.

### .get(path) / .put(path) / .post(path) / .delete(path) / …

There is a convenience method proxying `.request(…)` for each method in
`http.METHODS`. Returns a `Request`.

### .jar

A [`CookieJar`][cookiejar] instance for storing cookies.

## Request

### .set(key, value)

Set a request header by key and value. Returns the request.

### .set(headers)

Set headers from an object containing header key/value pairs. Returns the
request.

### .accept(type)

Set the `accept` header from a content-type or extension via
[`mime-types`][mime-types]. Returns the request.

### .type(type)

Set the `content-type` header from a content-type or extension via
[`mime-types`][mime-types]. Returns the request.

### .send()

Send the request with no body. Returns a promise that resolves as a `Response`.

### .send(body)

Send the request with the specified `body`. If `body` is an object, it's JSON
encoded and `content-type` is set to `application/json`. If `body` is a stream,
it's piped to the request. Returns a promise that resolves as a `Response`.

## Response

### .status

The numeric status code from the response.

### .headers

An object containing header values from the response.

### .body

If the response is JSON as indicated by the `content-type`, the decoded
response. Otherwise, the response string.

### .assert(number)

Assert the HTTP status value. Returns the response.

### .assert(string)

Assert the repsonse body value. Returns the response.

### .assert(regexp)

Assert that the response body matches a RegExp. Returns the response.

### .assert(object)

Assert the response body as a JSON object. Returns the response.

### .assert(number, string)

Assert the HTTP status and response body value. Returns the response.

### .assert(number, regexp)

Assert the HTTP status value and the response body matches a RegExp. Returns
the response.

### .assert(string, string)

Assert an HTTP header value. Returns the response.

### .assert(string, regexp)

Assert an HTTP header matches a RegExp. Returns the response.

[co]: https://github.com/tj/co
[koa]: http://koajs.com/
[express]: http://expressjs.com/
[cookiejar]: https://github.com/bmeck/node-cookiejar
[mime-types]: https://github.com/jshttp/mime-types
