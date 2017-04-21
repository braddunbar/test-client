'use strict'

const tap = require('tap')
const http = require('http')
const Client = require('../')
const Response = require('../response')
const {Readable} = require('stream')

tap.test('assert matching status', async (assert) => {
  const response = new Response(200, {}, '')
  try {
    response.assert(200)
  } catch (error) {
    assert.fail('matching status should not throw')
  }
})

tap.test('assert mismatched status', async (assert) => {
  const response = new Response(200, {}, '')
  try {
    response.assert(404)
    assert.fail('mismatched status should throw')
  } catch (error) {
    assert.is(error.message, 'expected 404, got 200')
  }
})

tap.test('assert missing header', async (assert) => {
  const response = new Response(200, {}, '')
  try {
    response.assert('accept', 'application/json')
    assert.fail('missing header should throw')
  } catch (error) {
    assert.is(error.message, "expected 'accept' of 'application/json', got undefined")
  }
})

tap.test('assert mismatched header', async (assert) => {
  const response = new Response(200, {accept: 'text/html'}, '')
  try {
    response.assert('accept', 'application/json')
    assert.fail('mismatched header should throw')
  } catch (error) {
    assert.is(error.message, "expected 'accept' of 'application/json', got 'text/html'")
  }
})

tap.test('assert matching header', async (assert) => {
  const response = new Response(200, {accept: 'application/json'}, {})
  try {
    response.assert('accept', 'application/json')
  } catch (error) {
    assert.fail('matching header should not throw')
  }
})

tap.test('assert mixed case header', async (assert) => {
  const response = new Response(200, {accept: 'application/json'}, {})
  try {
    response.assert('Accept', 'application/json')
  } catch (error) {
    assert.fail('matching header should not throw')
  }
})

tap.test('assert matching body', async (assert) => {
  const response = new Response(200, {}, 'body')
  try {
    response.assert('body')
  } catch (error) {
    assert.fail('matching body should not throw')
  }
})

tap.test('assert mismatched body', async (assert) => {
  const response = new Response(200, {}, 'x')
  try {
    response.assert('y')
    assert.fail('mismatched body should throw')
  } catch (error) {
    assert.is(error.message, "expected 'y', got 'x'")
  }
})

tap.test('assert mismatched status and body', async (assert) => {
  const response = new Response(200, {}, 'x')
  try {
    response.assert(404, 'y')
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, 'expected 404, got 200')
  }
})

tap.test('assert matching status, mismatched body', async (assert) => {
  const response = new Response(200, {}, 'x')
  try {
    response.assert(200, 'y')
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, "expected 'y', got 'x'")
  }
})

tap.test('assert matching regexp body', async (assert) => {
  const response = new Response(200, {}, 'x')
  try {
    response.assert(/x/)
  } catch (error) {
    assert.fail('matching should not throw')
  }
})

tap.test('assert mismatched regexp body', async (assert) => {
  const response = new Response(200, {}, 'x')
  try {
    response.assert(/y/)
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, "expected 'x' to match /y/")
  }
})

tap.test('assert status and matching regexp body', async (assert) => {
  const response = new Response(200, {}, 'x')
  try {
    response.assert(200, /x/)
  } catch (error) {
    assert.fail('matching should not throw')
  }
})

tap.test('assert status and mismatched regexp body', async (assert) => {
  const response = new Response(200, {}, 'x')
  try {
    response.assert(200, /y/)
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, "expected 'x' to match /y/")
  }
})

tap.test('assert matching regexp header', async (assert) => {
  const response = new Response(200, {accept: 'application/json'}, {})
  try {
    response.assert('accept', /json/)
  } catch (error) {
    assert.fail('matching should not throw')
  }
})

tap.test('assert mismatched regexp header', async (assert) => {
  const response = new Response(200, {accept: 'text/html'}, '')
  try {
    response.assert('accept', /json/)
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, "expected 'accept' of 'text/html' to match /json/")
  }
})

tap.test('assert matching json body', async (assert) => {
  const response = new Response(200, {'content-type': 'application/json'}, {x: 1})
  try {
    response.assert({x: 1})
  } catch (error) {
    assert.fail('matching should not throw')
  }
})

tap.test('assert mismatched json body', async (assert) => {
  const response = new Response(200, {'content-type': 'application/json'}, {x: 1})
  try {
    response.assert({x: 2})
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, 'expected { x: 2 }, got { x: 1 }')
  }
})

tap.test('json body with invalid response', async (assert) => {
  const client = new Client(http.createServer((request, response) => {
    response.setHeader('content-type', 'application/json')
    response.end('invalid')
  }))
  try {
    await client.get('/').send()
    assert.fail('invalid json should throw')
  } catch (error) {
    assert.is(error.message, 'Unexpected token i in JSON at position 0')
  }
})

tap.test('send a request', async (assert) => {
  const client = new Client(http.createServer((request, response) => {
    assert.is(request.url, '/')
    response.setHeader('content-type', 'text/plain')
    response.end('x')
  }))
  const response = await client.get('/').send()
  assert.is(response.status, 200)
  assert.is(response.body, 'x')
  assert.is(response.headers['content-type'], 'text/plain')
})

tap.test('set a header', async (assert) => {
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

tap.test('#set accepts an object', async (assert) => {
  const client = new Client(http.createServer((request, response) => {
    assert.is(request.url, '/x')
    assert.is(request.headers.accept, 'application/json')
    response.end('x')
  }))
  const response = await client
    .get('/x')
    .set({accept: 'application/json'})
    .send()
  assert.is(response.status, 200)
  assert.is(response.body, 'x')
})

tap.test('send a body', async (assert) => {
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

tap.test('send a json body', async (assert) => {
  const client = new Client(http.createServer((request, response) => {
    let body = ''
    request.on('data', (chunk) => { body += chunk.toString() })
    request.on('end', () => {
      assert.is(body, '{"x":1}')
      response.end()
    })
    assert.is(request.headers['content-type'], 'application/json; charset=utf-8')
  }))
  const response = await client.post('/x').send({x: 1})
  assert.is(response.status, 200)
})

tap.test('set request type', async (assert) => {
  const client = new Client(http.createServer((request, response) => {
    assert.is(request.headers['content-type'], 'application/json; charset=utf-8')
    response.end()
  }))
  const response = await client.post('/x').type('json').send()
  assert.is(response.status, 200)
})

tap.test('set request accept', async (assert) => {
  const client = new Client(http.createServer((request, response) => {
    assert.is(request.headers['accept'], 'application/json; charset=utf-8')
    response.end()
  }))
  const response = await client.post('/').accept('json').send()
  assert.is(response.status, 200)
})

tap.test('assert header undefined mismatch', async (assert) => {
  const client = new Client(http.createServer((request, response) => {
    response.setHeader('content-security-policy', "default-src 'self'")
    response.end()
  }))
  try {
    const response = await client.get('/').send()
    response.assert('content-security-policy', undefined)
    assert.fail('mismatched header should throw')
  } catch (error) {
    assert.is(error.message, "expected 'content-security-policy' of undefined, got 'default-src \\'self\\''")
  }
})

tap.test('assert header undefined match', async (assert) => {
  const client = new Client(http.createServer((request, response) => {
    response.end()
  }))
  const response = await client.get('/').send()
  response.assert('content-security-policy', undefined)
})

tap.test('send stream body', async (assert) => {
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

tap.test('remember cookies', async (assert) => {
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
