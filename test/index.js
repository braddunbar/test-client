'use strict'

const tap = require('tap')
const http = require('http')
const Client = require('../')
const Response = require('../response')
const { Readable } = require('stream')

tap.test('assert matching status: 200', async assert => {
  const response = new Response()
  response.assert(200)
})

tap.test('assert matching status: 404', async assert => {
  const response = new Response({ status: 404 })
  response.assert(404)
})

tap.test('assert mismatched status', async assert => {
  const response = new Response()
  assert.throws(() => { response.assert(404) }, 'expected 404, got 200')
})

tap.test('assert missing header', async assert => {
  const response = new Response()
  assert.throws(() => {
    response.assert('accept', 'application/json')
  }, "expected 'accept' of 'application/json', got undefined")
})

tap.test('assert mismatched header', async assert => {
  const response = new Response({ headers: { accept: 'text/html' } })
  assert.throws(() => {
    response.assert('accept', 'application/json')
  }, "expected 'accept' of 'application/json', got 'text/html'")
})

tap.test('assert matching header', async assert => {
  const response = new Response({ headers: { accept: 'application/json' } })
  response.assert('accept', 'application/json')
})

tap.test('assert mixed case header', async assert => {
  const response = new Response({ headers: { accept: 'application/json' } })
  response.assert('Accept', 'application/json')
})

tap.test('assert matching body', async assert => {
  const response = new Response({ body: 'body' })
  response.assert('body')
})

tap.test('assert mismatched body', async assert => {
  const response = new Response({ body: 'x' })
  assert.throws(() => { response.assert('y') }, "expected 'y', got 'x'")
})

tap.test('assert mismatched status and body', async assert => {
  const response = new Response({ body: 'x' })
  assert.throws(() => { response.assert(404, 'y') }, 'expected 404, got 200')
})

tap.test('assert matching status, mismatched body', async assert => {
  const response = new Response({ body: 'x' })
  assert.throws(() => { response.assert(200, 'y') }, "expected 'y', got 'x'")
})

tap.test('assert matching regexp body', async assert => {
  const response = new Response({ body: 'x' })
  response.assert(/x/)
})

tap.test('assert mismatched regexp body', async assert => {
  const response = new Response({ body: 'x' })
  assert.throws(() => { response.assert(/y/) }, "expected 'x' to match /y/")
})

tap.test('assert status and matching regexp body', async assert => {
  const response = new Response({ body: 'x' })
  response.assert(200, /x/)
})

tap.test('assert status and mismatched regexp body', async assert => {
  const response = new Response({ body: 'x' })
  assert.throws(() => { response.assert(200, /y/) }, "expected 'x' to match /y/")
})

tap.test('assert matching regexp header', async assert => {
  const response = new Response({ headers: { accept: 'application/json' } })
  response.assert('accept', /json/)
})

tap.test('assert mismatched regexp header', async assert => {
  const response = new Response({ headers: { accept: 'text/html' } })
  assert.throws(() => { response.assert('accept', /json/) }, "expected 'accept' of 'text/html' to match /json/")
})

tap.test('assert matching json body', async assert => {
  const response = new Response({ body: { x: 1 } })
  response.assert({ x: 1 })
})

tap.test('assert mismatched json body', async assert => {
  const response = new Response({ body: { x: 1 } })
  assert.throws(() => { response.assert({ x: 2 }) }, 'expected { x: 2 }, got { x: 1 }')
})

tap.test('assert with invalid arguments', async assert => {
  const response = new Response()
  assert.throws(() => { response.assert() }, 'Response#assert accepts one or two arguments')
})

tap.test('json body with invalid response', async assert => {
  const client = new Client(http.createServer((request, response) => {
    response.setHeader('content-type', 'application/json')
    response.end('invalid')
  }))
  assert.rejects(client.get('/').send(), 'Unexpected token i in JSON at position 0')
})

tap.test('send a request', async assert => {
  const client = new Client(http.createServer((request, response) => {
    assert.is(request.url, '/')
    response.setHeader('content-type', 'text/plain')
    response.end('x')
  }))
  const response = await client.get('/').send()
  assert.is(response.status, 200)
  assert.is(response.body, 'x')
  assert.is(response.headers.get('content-type'), 'text/plain')
})

tap.test('set header with invalid arguments', async assert => {
  const client = new Client(http.createServer((request, response) => {
    response.end('')
  }))
  assert.throws(() => { client.get('/').set() }, 'Request#set accepts one or two arguments')
})

tap.test('set a header', async assert => {
  const client = new Client(http.createServer((request, response) => {
    assert.is(request.url, '/x')
    assert.is(request.headers.accept, 'application/json')
    response.end('x')
  }))
  const response = await client
    .get('/x')
    .set('accept', 'application/json')
    .send()
  assert.is(response.status, 200)
  assert.is(response.body, 'x')
})

tap.test('#set accepts an object', async assert => {
  const client = new Client(http.createServer((request, response) => {
    assert.is(request.url, '/x')
    assert.is(request.headers.accept, 'application/json')
    response.end('x')
  }))
  const response = await client
    .get('/x')
    .set({ accept: 'application/json' })
    .send()
  assert.is(response.status, 200)
  assert.is(response.body, 'x')
})

tap.test('send a body', async assert => {
  const client = new Client(http.createServer((request, response) => {
    let body = ''
    request.on('data', (chunk) => { body += chunk.toString() })
    request.on('end', () => {
      assert.is(body, 'test')
      response.end()
    })
  }))
  const response = await client.post('/x').send('test')
  assert.is(response.status, 200)
})

tap.test('send a json body', async assert => {
  const client = new Client(http.createServer((request, response) => {
    let body = ''
    request.on('data', (chunk) => { body += chunk.toString() })
    request.on('end', () => {
      assert.is(body, '{"x":1}')
      response.end()
    })
    assert.is(request.headers['content-type'], 'application/json; charset=utf-8')
  }))
  const response = await client.post('/x').send({ x: 1 })
  assert.is(response.status, 200)
})

tap.test('set request type', async assert => {
  const client = new Client(http.createServer((request, response) => {
    assert.is(request.headers['content-type'], 'application/json; charset=utf-8')
    response.end()
  }))
  const response = await client.post('/x').type('json').send()
  assert.is(response.status, 200)
})

tap.test('set request accept', async assert => {
  const client = new Client(http.createServer((request, response) => {
    assert.is(request.headers['accept'], 'application/json; charset=utf-8')
    response.end()
  }))
  const response = await client.post('/').accept('json').send()
  assert.is(response.status, 200)
})

tap.test('assert header undefined mismatch', async assert => {
  const client = new Client(http.createServer((request, response) => {
    response.setHeader('content-security-policy', "default-src 'self'")
    response.end()
  }))
  const response = await client.get('/').send()
  assert.throws(() => { response.assert('content-security-policy', null) }, "expected 'content-security-policy' of undefined, got 'default-src \\'self\\''")
})

tap.test('assert header undefined match', async assert => {
  const client = new Client(http.createServer((request, response) => {
    response.end()
  }))
  const response = await client.get('/').send()
  response.assert('content-security-policy', null)
})

tap.test('send stream body', async assert => {
  const client = new Client(http.createServer((request, response) => {
    let body = ''
    request.on('data', (chunk) => { body += chunk.toString() })
    request.on('end', () => {
      assert.is(body, 'xyz')
      response.end()
    })
  }))
  const stream = new Readable()
  const request = client.post('/').send(stream)
  stream.push('x')
  stream.push('y')
  stream.push('z')
  stream.push(null)

  const response = await request
  assert.is(response.status, 200)
})

tap.test('remember cookies', async assert => {
  const client = new Client(http.createServer((request, response) => {
    switch (request.url) {
      case '/get':
        assert.is(request.headers.cookie, 'x=1')
        break

      case '/set':
        response.setHeader('set-cookie', 'x=1')
        break
    }
    response.end()
  }))
  const set = await client.get('/set').send()
  set.assert(200)
  const get = await client.get('/get').send()
  get.assert(200)
})
