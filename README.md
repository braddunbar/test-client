# test-client

`test-client` is a small HTTP assertion library that uses promises, enabling
tests to be written with[`co`][co] generators and, eventually, `async`/`await`.

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
    .expect(200, {x: 2})
    .expect('content-type', /json/)
})
```

[co]: https://github.com/tj/co
