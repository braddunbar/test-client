'use strict'

const http = require('http')
const test = require('./test')
const Client = require('../')
const Response = require('../response')

test('expect matching status', function *(assert) {
  const response = new Response(200, {}, '')
  try {
    response.expect(200)
  } catch (error) {
    assert.fail('matching status should not throw')
  }
})

test('expect mismatched status', function *(assert) {
  const response = new Response(200, {}, '')
  try {
    response.expect(404)
    assert.fail('mismatched status should throw')
  } catch (error) {
    assert.is(error.message, 'expected 404, got 200')
  }
})

test('expect missing header', function *(assert) {
  const response = new Response(200, {}, '')
  try {
    response.expect('accept', 'application/json')
    assert.fail('missing header should throw')
  } catch (error) {
    assert.is(error.message, "expected 'accept' header")
  }
})

test('expect mismatched header', function *(assert) {
  const response = new Response(200, {accept: 'text/html'}, '')
  try {
    response.expect('accept', 'application/json')
    assert.fail('mismatched header should throw')
  } catch (error) {
    assert.is(error.message, "expected 'accept' of 'application/json', got 'text/html'")
  }
})

test('expect matching header', function *(assert) {
  const response = new Response(200, {accept: 'application/json'}, '')
  try {
    response.expect('accept', 'application/json')
  } catch (error) {
    assert.fail('matching header should not throw')
  }
})

test('expect mixed case header', function *(assert) {
  const response = new Response(200, {accept: 'application/json'}, '')
  try {
    response.expect('Accept', 'application/json')
  } catch (error) {
    assert.fail('matching header should not throw')
  }
})

test('expect matching body', function *(assert) {
  const response = new Response(200, {}, 'body')
  try {
    response.expect('body')
  } catch (error) {
    assert.fail('matching body should not throw')
  }
})

test('expect mismatched body', function *(assert) {
  const response = new Response(200, {}, 'x')
  try {
    response.expect('y')
    assert.fail('mismatched body should throw')
  } catch (error) {
    assert.is(error.message, "expected 'y', got 'x'")
  }
})

test('expect mismatched status and body', function *(assert) {
  const response = new Response(200, {}, 'x')
  try {
    response.expect(404, 'y')
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, 'expected 404, got 200')
  }
})

test('expect matching status, mismatched body', function *(assert) {
  const response = new Response(200, {}, 'x')
  try {
    response.expect(200, 'y')
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, "expected 'y', got 'x'")
  }
})

test('expect matching regexp body', function *(assert) {
  const response = new Response(200, {}, 'x')
  try {
    response.expect(/x/)
  } catch (error) {
    assert.fail('matching should not throw')
  }
})

test('expect mismatched regexp body', function *(assert) {
  const response = new Response(200, {}, 'x')
  try {
    response.expect(/y/)
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, "expected 'x' to match /y/")
  }
})

test('expect status and matching regexp body', function *(assert) {
  const response = new Response(200, {}, 'x')
  try {
    response.expect(200, /x/)
  } catch (error) {
    assert.fail('matching should not throw')
  }
})

test('expect status and mismatched regexp body', function *(assert) {
  const response = new Response(200, {}, 'x')
  try {
    response.expect(200, /y/)
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, "expected 'x' to match /y/")
  }
})

test('expect matching regexp header', function *(assert) {
  const response = new Response(200, {accept: 'application/json'}, 'x')
  try {
    response.expect('accept', /json/)
  } catch (error) {
    assert.fail('matching should not throw')
  }
})

test('expect mismatched regexp header', function *(assert) {
  const response = new Response(200, {accept: 'text/html'}, 'x')
  try {
    response.expect('accept', /json/)
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, "expected 'accept' of 'text/html' to match /json/")
  }
})

test('expect matching json body', function *(assert) {
  const response = new Response(200, {}, '{"x":1}')
  try {
    response.expect({x: 1})
  } catch (error) {
    assert.fail('matching should not throw')
  }
})

test('expect mismatched json body', function *(assert) {
  const response = new Response(200, {}, '{"x":1}')
  try {
    response.expect({x: 2})
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, "expected { x: 2 }, got { x: 1 }")
  }
})

test('expect json body with invalid response', function *(assert) {
  const response = new Response(200, {}, 'invalid')
  try {
    response.expect({x: 2})
    assert.fail('mismatch should throw')
  } catch (error) {
    assert.is(error.message, "Unexpected token i in JSON at position 0")
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

test('send a body', function *(assert) {
  const client = new Client(http.createServer((request, response) => {
    let body = ''
    request.on('data', (chunk) => body += chunk.toString())
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
    request.on('data', (chunk) => body += chunk.toString())
    request.on('end', () => {
      assert.is(body, '{"x":1}')
      response.end()
    })
  }))
  const response = yield client.post('/x').send({x: 1})
  assert.is(response.status, 200)
})
