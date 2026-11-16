'use strict';

/**
 * Validates a student payload (used for both POST and PUT).
 * Returns { errors: string[], value: {...cleaned} }.
 */
function validateStudent(body) {
  const errors = [];

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'], value: null };
  }

  const { name, rollNo, department, semester } = body;

  // name
  if (name === undefined || name === null || name === '') {
    errors.push('name is required');
  } else if (typeof name !== 'string') {
    errors.push('name must be a string');
  } else if (name.trim().length < 2 || name.trim().length > 100) {
    errors.push('name must be between 2 and 100 characters');
  }

  // rollNo
  if (rollNo === undefined || rollNo === null || rollNo === '') {
    errors.push('rollNo is required');
  } else if (typeof rollNo !== 'string') {
    errors.push('rollNo must be a string');
  } else if (!/^[A-Za-z0-9-]{3,20}$/.test(rollNo.trim())) {
    errors.push('rollNo must be 3-20 characters (letters, digits or hyphen only)');
  }

  // department
  if (department === undefined || department === null || department === '') {
    errors.push('department is required');
  } else if (typeof department !== 'string') {
    errors.push('department must be a string');
  } else if (department.trim().length < 2 || department.trim().length > 100) {
    errors.push('department must be between 2 and 100 characters');
  }

  // semester
  if (semester === undefined || semester === null || semester === '') {
    errors.push('semester is required');
  } else if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
    errors.push('semester must be an integer between 1 and 8');
  }

  if (errors.length) return { errors, value: null };

  return {
    errors,
    value: {
      name: name.trim(),
      rollNo: rollNo.trim(),
      department: department.trim(),
      semester,
    },
  };
}

/** Parses a :id route parameter. Returns a positive integer or null. */
function parseId(raw) {
  if (!/^[1-9]\d*$/.test(String(raw))) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

module.exports = { validateStudent, parseId };
