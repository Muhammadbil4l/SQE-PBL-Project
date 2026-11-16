'use strict';
// Generates postman/Student_API.postman_collection.json and the environment file.
const fs = require('fs');
const path = require('path');

const url = (p) => {
  const raw = `{{baseUrl}}/api/students${p ? '/' + p : ''}`;
  return { raw, host: ['{{baseUrl}}'], path: p ? ['api', 'students', p] : ['api', 'students'] };
};
const jsonHeader = [{ key: 'Content-Type', value: 'application/json' }];
const body = (obj) => ({ mode: 'raw', raw: typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2), options: { raw: { language: 'json' } } });
const exec = (lines) => ({ listen: 'test', script: { type: 'text/javascript', exec: lines } });
const pre = (lines) => ({ listen: 'prerequest', script: { type: 'text/javascript', exec: lines } });

const jsonCheck = [
  "pm.test('Content-Type is application/json', () => pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json'));",
  "pm.test('Response time < 1000 ms', () => pm.expect(pm.response.responseTime).to.be.below(1000));",
];

function req(name, method, p, bodyObj, tests, preLines, description) {
  const item = {
    name,
    event: [exec([...tests, ...jsonCheck])],
    request: { method, header: bodyObj !== undefined ? jsonHeader : [], url: url(p), description },
  };
  if (preLines) item.event.unshift(pre(preLines));
  if (bodyObj !== undefined) item.request.body = body(bodyObj);
  return item;
}

const validBody = (semester) => ({
  name: 'Ali Ahmed',
  rollNo: '{{rollNo}}',
  department: 'Software Engineering',
  semester,
});

const crud = [
  req('TC01 - CREATE: Add a valid student (POST)', 'POST', '', validBody(1), [
    "pm.test('Status code is 201 Created', () => pm.response.to.have.status(201));",
    "const d = pm.response.json();",
    "pm.test('Returned data matches request', () => {",
    "  pm.expect(d.name).to.eql('Ali Ahmed');",
    "  pm.expect(d.rollNo).to.eql(pm.collectionVariables.get('rollNo'));",
    "  pm.expect(d.department).to.eql('Software Engineering');",
    "  pm.expect(d.semester).to.eql(1);",
    "});",
    "pm.test('Server generated an id', () => pm.expect(d.id).to.be.a('number'));",
    "pm.test('Location header points to new record', () => pm.expect(pm.response.headers.get('Location')).to.eql('/api/students/' + d.id));",
    "pm.collectionVariables.set('studentId', d.id);",
  ], [
    "// unique roll number on every run so the collection can be re-run safely",
    "pm.collectionVariables.set('rollNo', 'K22SW' + Date.now().toString().slice(-8));",
  ], 'Adds a new student. Expected: 201 Created + created record.'),

  req('TC02 - READ: Get all students (GET)', 'GET', '', undefined, [
    "pm.test('Status code is 200 OK', () => pm.response.to.have.status(200));",
    "const list = pm.response.json();",
    "pm.test('Body is a JSON array', () => pm.expect(list).to.be.an('array'));",
    "pm.test('Array contains the student created in TC01', () => {",
    "  const id = pm.collectionVariables.get('studentId');",
    "  pm.expect(list.some(s => s.id === id)).to.be.true;",
    "});",
  ], undefined, 'Retrieves every student. Expected: 200 OK + JSON array.'),

  req('TC03 - READ: Get a single student by ID (GET)', 'GET', '{{studentId}}', undefined, [
    "pm.test('Status code is 200 OK', () => pm.response.to.have.status(200));",
    "const d = pm.response.json();",
    "pm.test('Correct record returned', () => {",
    "  pm.expect(d.id).to.eql(pm.collectionVariables.get('studentId'));",
    "  pm.expect(d.rollNo).to.eql(pm.collectionVariables.get('rollNo'));",
    "  pm.expect(d.semester).to.eql(1);",
    "});",
  ], undefined, 'Retrieves one student by its database ID. Expected: 200 OK.'),

  req('TC04 - UPDATE: Update an existing student (PUT)', 'PUT', '{{studentId}}', validBody(2), [
    "pm.test('Status code is 200 OK', () => pm.response.to.have.status(200));",
    "const d = pm.response.json();",
    "pm.test('Semester updated to 2', () => pm.expect(d.semester).to.eql(2));",
    "pm.test('ID and rollNo unchanged', () => {",
    "  pm.expect(d.id).to.eql(pm.collectionVariables.get('studentId'));",
    "  pm.expect(d.rollNo).to.eql(pm.collectionVariables.get('rollNo'));",
    "});",
  ], undefined, 'Updates semester from 1 to 2. Expected: 200 OK + updated record.'),
];

const errors = [
  req('TC05 - ERROR: Duplicate rollNo (POST)', 'POST', '', validBody(1), [
    "pm.test('Status code is 409 Conflict', () => pm.response.to.have.status(409));",
    "pm.test('Error message explains duplicate', () => pm.expect(pm.response.json().message).to.include('already exists'));",
  ], undefined, 'Same rollNo as TC01. Expected: 409 Conflict.'),

  req('TC06 - ERROR: Missing required fields (POST)', 'POST', '', { name: 'Only Name' }, [
    "pm.test('Status code is 400 Bad Request', () => pm.response.to.have.status(400));",
    "const d = pm.response.json();",
    "pm.test('Error list mentions missing fields', () => {",
    "  pm.expect(d.error).to.eql('Validation Failed');",
    "  pm.expect(d.details).to.include('rollNo is required');",
    "  pm.expect(d.details).to.include('department is required');",
    "  pm.expect(d.details).to.include('semester is required');",
    "});",
  ], undefined, 'Only "name" is sent. Expected: 400 + list of missing fields.'),

  req('TC07 - ERROR: Invalid data (semester = 12, name is a number) (POST)', 'POST', '',
    { name: 12345, rollNo: 'K22SW999', department: 'Software Engineering', semester: 12 }, [
    "pm.test('Status code is 400 Bad Request', () => pm.response.to.have.status(400));",
    "const d = pm.response.json();",
    "pm.test('Validation errors for semester and name', () => {",
    "  pm.expect(d.details).to.include('name must be a string');",
    "  pm.expect(d.details).to.include('semester must be an integer between 1 and 8');",
    "});",
  ], undefined, 'Wrong data types / out-of-range value. Expected: 400.'),

  req('TC08 - ERROR: Malformed JSON body (POST)', 'POST', '', '{ "name": "Broken JSON", ', [
    "pm.test('Status code is 400 Bad Request', () => pm.response.to.have.status(400));",
    "pm.test('Message says invalid JSON', () => pm.expect(pm.response.json().message).to.include('invalid JSON'));",
  ], undefined, 'Body is not valid JSON. Expected: 400.'),

  req('TC09 - ERROR: Update with invalid data (PUT)', 'PUT', '{{studentId}}', { name: 'X' }, [
    "pm.test('Status code is 400 Bad Request', () => pm.response.to.have.status(400));",
    "pm.test('Validation details returned', () => pm.expect(pm.response.json().details).to.be.an('array').that.is.not.empty);",
  ], undefined, 'PUT with incomplete/invalid body. Expected: 400 and record stays unchanged.'),

  req('TC10 - ERROR: Get non-existent ID (GET)', 'GET', '999999', undefined, [
    "pm.test('Status code is 404 Not Found', () => pm.response.to.have.status(404));",
    "pm.test('Error message returned', () => pm.expect(pm.response.json().message).to.include('not found'));",
  ], undefined, 'ID 999999 does not exist. Expected: 404.'),

  req('TC11 - ERROR: Update non-existent ID (PUT)', 'PUT', '999999', validBody(3), [
    "pm.test('Status code is 404 Not Found', () => pm.response.to.have.status(404));",
  ], undefined, 'Expected: 404.'),

  req('TC12 - ERROR: Delete non-existent ID (DELETE)', 'DELETE', '999999', undefined, [
    "pm.test('Status code is 404 Not Found', () => pm.response.to.have.status(404));",
  ], undefined, 'Expected: 404.'),

  req('TC13 - ERROR: Invalid ID format "abc" (GET)', 'GET', 'abc', undefined, [
    "pm.test('Status code is 400 Bad Request', () => pm.response.to.have.status(400));",
    "pm.test('Message says id must be a positive integer', () => pm.expect(pm.response.json().message).to.include('positive integer'));",
  ], undefined, 'ID is not a number. Expected: 400.'),
];

const del = [
  req('TC14 - DELETE: Delete an existing student (DELETE)', 'DELETE', '{{studentId}}', undefined, [
    "pm.test('Status code is 200 OK', () => pm.response.to.have.status(200));",
    "pm.test('Success message returned', () => pm.expect(pm.response.json().message).to.include('deleted successfully'));",
  ], undefined, 'Deletes the student created in TC01. Expected: 200 OK.'),

  req('TC15 - VERIFY: Deleted student cannot be retrieved (GET)', 'GET', '{{studentId}}', undefined, [
    "pm.test('Status code is 404 Not Found', () => pm.response.to.have.status(404));",
    "pm.test('Deleted record is gone', () => pm.expect(pm.response.json().error).to.eql('Not Found'));",
  ], undefined, 'Confirms the delete worked. Expected: 404.'),
];

const collection = {
  info: {
    name: 'Student CRUD API - SW426 PBL',
    description: 'Postman tests for the Student CRUD REST API (Express + SQLite). Run the whole collection with the Collection Runner or Newman.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    { name: '1. CRUD Operations (valid requests)', item: crud },
    { name: '2. Error Handling & Validation', item: errors },
    { name: '3. Delete & Verify', item: del },
  ],
  variable: [
    { key: 'studentId', value: '' },
    { key: 'rollNo', value: '' },
  ],
};

const environment = {
  id: 'student-api-local',
  name: 'Student API - Local',
  values: [{ key: 'baseUrl', value: 'http://localhost:3000', type: 'default', enabled: true }],
  _postman_variable_scope: 'environment',
};

const out = path.join(__dirname, '..', 'postman');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'Student_API.postman_collection.json'), JSON.stringify(collection, null, 2));
fs.writeFileSync(path.join(out, 'Local.postman_environment.json'), JSON.stringify(environment, null, 2));
console.log('Postman files written.');
