# Student CRUD REST API

**Course:** SW426 – Software Quality Engineering (PBL)  
**University:** Mehran University of Engineering and Technology, SZAB Campus, Khairpur Mir's  
**Stack:** Node.js 22+ · Express 5 · SQLite (built-in `node:sqlite`) · Postman / Newman

A database-connected REST API that manages **Student** records and supports all four CRUD operations
with JSON request/response bodies, proper HTTP status codes, input validation and error handling.

## Quick start

Requirements: **Node.js 22.13 or newer** (LTS from https://nodejs.org). No separate database server is needed – this project uses the SQLite database that is built into Node.js, so `npm install` has nothing to compile.

```bash
git clone <your-repo-url>
cd student-crud-api
npm install
npm run seed      # optional: adds 3 sample students
npm start         # API runs at http://localhost:3000
```

The database file is created automatically at `data/students.db`.

## Endpoints

Base URL: `http://localhost:3000/api/students`

| Operation | Method & URL | Success | Errors |
|-----------|--------------|---------|--------|
| Create | `POST /api/students` | `201 Created` | `400` validation, `409` duplicate rollNo |
| Read all | `GET /api/students` | `200 OK` | – |
| Read one | `GET /api/students/:id` | `200 OK` | `400` bad id, `404` not found |
| Update | `PUT /api/students/:id` | `200 OK` | `400` validation / bad id, `404`, `409` |
| Delete | `DELETE /api/students/:id` | `200 OK` | `400` bad id, `404` not found |

### Student JSON

```json
{
  "name": "Ali Ahmed",
  "rollNo": "K22SW001",
  "department": "Software Engineering",
  "semester": 1
}
```

Validation rules: `name` 2–100 chars · `rollNo` 3–20 chars (letters/digits/hyphen, unique) · `department` 2–100 chars · `semester` integer 1–8.  
All four fields are required for both `POST` and `PUT`.

### Example (curl)

```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Ali Ahmed","rollNo":"K22SW010","department":"Software Engineering","semester":1}'
```

## Testing

**1. Postman (manual / Collection Runner)**
1. Open Postman → *Import* → select both files from the `postman/` folder:
   `Student_API.postman_collection.json` and `Local.postman_environment.json`.
2. Select the environment **Student API - Local** (top-right).
3. Start the API (`npm start`), then right-click the collection → **Run collection**.

The collection contains 15 requests (TC01–TC15) with 62 assertions covering all CRUD operations,
validation errors, duplicate data, malformed JSON, non-existent IDs and delete verification.

**2. Newman (Postman from the terminal)** – start the API in one terminal, then in another (Newman is downloaded automatically the first time):

```bash
npm run postman
```

**3. Automated unit/integration tests** (uses an in-memory DB, no server needed):

```bash
npm test
```

## Project structure

```
server.js                    entry point
src/app.js                   Express app factory
src/db.js                    SQLite connection + schema
src/routes/students.js       CRUD routes
src/middleware/validate.js   input validation
src/middleware/errorHandler.js  404 + central JSON error handler
scripts/seed.js              sample data
scripts/build-postman.js     generates the Postman collection
tests/api.test.js            automated tests
postman/                     Postman collection + environment
```

## Configuration (optional)

Copy `.env.example` values into your shell environment: `PORT` (default `3000`) and `DB_FILE` (default `./data/students.db`).
