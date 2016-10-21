'use strict'

const http = require('http')
const test = require('./test')
const Client = require('../')
const Response = require('../response')
const {Readable} = require('stream')

test('assert matching status', function *(assert) {
  const response = new Response(200, {}, '')
  try {
    response.assert(200)
  } catch (error) {
    assert.fail('matching status should not throw')
  }
})

test('assert mismatched status', function *(assert) {
  const response = new Response(200, {}, '')
  try {
    response.assert(404)
    assert.fail('mismatched status should throw')
  } catch (error) {
    assert.is(error.message, 'expected 404, got 200')
  }
})

test('assert missing header', function *(assert) {
  const response = new Response(200, {}, '')
  try {
    response.assert('accept', 'application/json')
    assert.fail('missing header should throw')
  } catch (error) {
    assert.is(error.message, "expected 'accept' of 'application/json', got undefined")
  }
})

test('assert mismatched header', function *(assert) {
  const response = new Response(200, {accept: 'text/html'}, '')
  try {
    response.assert('accept', 'application/json')
    assert.fail('mismatched header should throw')
  } catch (error) {
    assert.is(error.message, "expected 'accept' of 'application/json', got 'text/html'")
  }
})

test('assert matching header', function *(assert) {
  const response = new Response(200, {accept: 'application/json'}, {})
  try {
    response.assert('accept', 'application/json')
  } catch (error) {
    assert.fail('matching header should not throw')
  }
})

test('assert mixed case header', function *(assert) {
  const response = new Response(200, {accept: 'application/json'}, {})
  try {
    response.assert('Accept', 'application/json')
  } catch (error) {
    assert.fail('matching header should not throw')
  }
})

test('assert matching body', function *(assert) {
  const response = new Response(200, {}, 'body')
  try {
    response.assert('body')
  } catch (error) {
    assert.fail('matching body should not throw')
  }
})

test('assert mismatched body', function *(assert) {
  const response = new Response(200, {}, 'x')
  try {
    response.assert('y')
    assert.fail('mismatched body should throw')
  } catch (error) {
    assert.is(error.message, "expected 'y', got 'x'")
  }
})

test('assert mismatched status and body', function *(assert) {
  const response = new Response(200, {}, 'x')
  try {
    response.assert(404, 'y')
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, 'expected 404, got 200')
  }
})

test('assert matching status, mismatched body', function *(assert) {
  const response = new Response(200, {}, 'x')
  try {
    response.assert(200, 'y')
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, "expected 'y', got 'x'")
  }
})

test('assert matching regexp body', function *(assert) {
  const response = new Response(200, {}, 'x')
  try {
    response.assert(/x/)
  } catch (error) {
    assert.fail('matching should not throw')
  }
})

test('assert mismatched regexp body', function *(assert) {
  const response = new Response(200, {}, 'x')
  try {
    response.assert(/y/)
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, "expected 'x' to match /y/")
  }
})

test('assert status and matching regexp body', function *(assert) {
  const response = new Response(200, {}, 'x')
  try {
    response.assert(200, /x/)
  } catch (error) {
    assert.fail('matching should not throw')
  }
})

test('assert status and mismatched regexp body', function *(assert) {
  const response = new Response(200, {}, 'x')
  try {
    response.assert(200, /y/)
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, "expected 'x' to match /y/")
  }
})

test('assert matching regexp header', function *(assert) {
  const response = new Response(200, {accept: 'application/json'}, {})
  try {
    response.assert('accept', /json/)
  } catch (error) {
    assert.fail('matching should not throw')
  }
})

test('assert mismatched regexp header', function *(assert) {
  const response = new Response(200, {accept: 'text/html'}, '')
  try {
    response.assert('accept', /json/)
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, "expected 'accept' of 'text/html' to match /json/")
  }
})

test('assert matching json body', function *(assert) {
  const response = new Response(200, {'content-type': 'application/json'}, {x: 1})
  try {
    response.assert({x: 1})
  } catch (error) {
    assert.fail('matching should not throw')
  }
})

test('assert mismatched json body', function *(assert) {
  const response = new Response(200, {'content-type': 'application/json'}, {x: 1})
  try {
    response.assert({x: 2})
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, 'expected { x: 2 }, got { x: 1 }')
  }
})

test('json body with invalid response', function *(assert) {
  const client = new Client(http.createServer((request, response) => {
    response.setHeader('content-type', 'application/json')
    response.end('invalid')
  }))
  try {
    yield client.get('/').send()
    assert.fail('invalid json should throw')
  } catch (error) {
    assert.is(error.message, 'Unexpected token i in JSON at position 0')
  }
})

test('send a request', function *(assert) {
  const client = new Client(http.createServer((request, response) => {
    assert.is(request.url, '/')
    response.setHeader('content-type', 'text/plain')
    response.end('x')
  }))
  const response = yield client.get('/').send()
  assert.is(response.status, 200)
  assert.is(response.body, 'x')
  assert.is(response.headers['content-type'], 'text/plain')
})

test('set a header', function *(assert) {
  const client = new Client(http.createServer((request, response) => {
    assert.is(request.url, '/x')
    assert.is(request.headers.accept, 'application/json')
    response.end('x')
  }))
  const response = yield client
    .get('/x')
    .set('accept', 'application/json')
    .send()
  assert.is(response.status, 200)
  assert.is(response.body, 'x')
})

test('#set accepts an object', function *(assert) {
  const client = new Client(http.createServer((request, response) => {
    assert.is(request.url, '/x')
    assert.is(request.headers.accept, 'application/json')
    response.end('x')
  }))
  const response = yield client
    .get('/x')
    .set({accept: 'application/json'})
    .send()
  assert.is(response.status, 200)
  assert.is(response.body, 'x')
})

test('send a body', function *(assert) {
  const client = new Client(http.createServer((request, response) => {
    let body = ''
    request.on('data', (chunk) => { body += chunk.toString() })
    request.on('end', () => {
      assert.is(body, 'test')
      response.end()
    })
  }))
  const response = yield client.post('/x').send('test')
  assert.is(response.status, 200)
})

test('send a json body', function *(assert) {
  const client = new Client(http.createServer((request, response) => {
    let body = ''
    request.on('data', (chunk) => { body += chunk.toString() })
    request.on('end', () => {
      assert.is(body, '{"x":1}')
      response.end()
    })
    assert.is(request.headers['content-type'], 'application/json; charset=utf-8')
  }))
  const response = yield client.post('/x').send({x: 1})
  assert.is(response.status, 200)
})

test('set request type', function *(assert) {
  const client = new Client(http.createServer((request, response) => {
    assert.is(request.headers['content-type'], 'application/json; charset=utf-8')
    response.end()
  }))
  const response = yield client.post('/x').type('json').send()
  assert.is(response.status, 200)
})

test('set request accept', function *(assert) {
  const client = new Client(http.createServer((request, response) => {
    assert.is(request.headers['accept'], 'application/json; charset=utf-8')
    response.end()
  }))
  const response = yield client.post('/').accept('json').send()
  assert.is(response.status, 200)
})

test('assert header undefined mismatch', function *(assert) {
  const client = new Client(http.createServer((request, response) => {
    response.setHeader('content-security-policy', "default-src 'self'")
    response.end()
  }))
  try {
    const response = yield client.get('/').send()
    response.assert('content-security-policy', undefined)
    assert.fail('mismatched header should throw')
  } catch (error) {
    assert.is(error.message, "expected 'content-security-policy' of undefined, got 'default-src \\'self\\''")
  }
})

test('assert header undefined match', function *(assert) {
  const client = new Client(http.createServer((request, response) => {
    response.end()
  }))
  const response = yield client.get('/').send()
  response.assert('content-security-policy', undefined)
})

test('send stream body', function *(assert) {
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

  const response = yield request
  assert.is(response.status, 200)
})

test('remember cookies', function *(assert) {
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
  const set = yield client.get('/set').send()
  set.assert(200)
  const get = yield client.get('/get').send()
  get.assert(200)
})
