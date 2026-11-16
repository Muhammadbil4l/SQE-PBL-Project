'use strict';
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/db');
const { createApp } = require('../src/app');

let server, base, db;

before(async () => {
  db = createDatabase(':memory:');
  server = createApp(db).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${server.address().port}/api/students`;
});

after(() => {
  server.close();
  db.close();
});

const valid = (extra = {}) => ({
  name: 'Ali Ahmed',
  rollNo: 'K22SW001',
  department: 'Software Engineering',
  semester: 1,
  ...extra,
});

const send = (url, method, body, raw) =>
  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body),
  });

describe('CRUD happy path', () => {
  let id;

  test('POST creates a student -> 201', async () => {
    const res = await send(base, 'POST', valid());
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.id);
    assert.equal(data.rollNo, 'K22SW001');
    assert.equal(res.headers.get('location'), `/api/students/${data.id}`);
    id = data.id;
  });

  test('GET all -> 200 array', async () => {
    const res = await send(base, 'GET');
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.equal(data.length, 1);
  });

  test('GET one -> 200', async () => {
    const res = await send(`${base}/${id}`, 'GET');
    assert.equal(res.status, 200);
    assert.equal((await res.json()).name, 'Ali Ahmed');
  });

  test('PUT updates -> 200 with new data, persisted', async () => {
    const res = await send(`${base}/${id}`, 'PUT', valid({ semester: 2 }));
    assert.equal(res.status, 200);
    assert.equal((await res.json()).semester, 2);
    const again = await (await send(`${base}/${id}`, 'GET')).json();
    assert.equal(again.semester, 2);
  });

  test('DELETE removes -> 200, then GET -> 404', async () => {
    const del = await send(`${base}/${id}`, 'DELETE');
    assert.equal(del.status, 200);
    const get = await send(`${base}/${id}`, 'GET');
    assert.equal(get.status, 404);
  });
});

describe('Validation & error handling', () => {
  test('POST with missing fields -> 400 + details', async () => {
    const res = await send(base, 'POST', { name: 'Only Name' });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.details.length >= 3);
  });

  test('POST with empty body -> 400', async () => {
    const res = await fetch(base, { method: 'POST' });
    assert.equal(res.status, 400);
  });

  test('POST with wrong types -> 400', async () => {
    const res = await send(base, 'POST', valid({ semester: 'one', name: 123 }));
    assert.equal(res.status, 400);
  });

  test('POST semester out of range -> 400', async () => {
    assert.equal((await send(base, 'POST', valid({ rollNo: 'X1', semester: 9 }))).status, 400);
    assert.equal((await send(base, 'POST', valid({ rollNo: 'X2', semester: 0 }))).status, 400);
  });

  test('POST with malformed JSON -> 400', async () => {
    const res = await send(base, 'POST', undefined, '{ "name": "bad", ');
    assert.equal(res.status, 400);
    assert.equal((await res.json()).message, 'Request body contains invalid JSON');
  });

  test('POST with JSON array body -> 400', async () => {
    assert.equal((await send(base, 'POST', [valid()])).status, 400);
  });

  test('POST duplicate rollNo -> 409', async () => {
    assert.equal((await send(base, 'POST', valid({ rollNo: 'DUP001' }))).status, 201);
    assert.equal((await send(base, 'POST', valid({ rollNo: 'DUP001' }))).status, 409);
  });

  test('GET non-existent id -> 404', async () => {
    assert.equal((await send(`${base}/99999`, 'GET')).status, 404);
  });

  test('PUT non-existent id -> 404', async () => {
    assert.equal((await send(`${base}/99999`, 'PUT', valid({ rollNo: 'N1' }))).status, 404);
  });

  test('DELETE non-existent id -> 404', async () => {
    assert.equal((await send(`${base}/99999`, 'DELETE')).status, 404);
  });

  test('invalid id format (abc, -1, 0, 1.5) -> 400', async () => {
    for (const bad of ['abc', '-1', '0', '1.5']) {
      assert.equal((await send(`${base}/${bad}`, 'GET')).status, 400, `id=${bad}`);
    }
  });

  test('PUT with invalid data -> 400 and record unchanged', async () => {
    const created = await (await send(base, 'POST', valid({ rollNo: 'PUT001' }))).json();
    const res = await send(`${base}/${created.id}`, 'PUT', { name: 'X' });
    assert.equal(res.status, 400);
    const after = await (await send(`${base}/${created.id}`, 'GET')).json();
    assert.equal(after.name, 'Ali Ahmed');
  });

  test('unknown route -> 404 JSON', async () => {
    const res = await fetch(base.replace('/students', '/unknown'));
    assert.equal(res.status, 404);
    assert.equal((await res.json()).error, 'Not Found');
  });
});
