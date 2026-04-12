/**
 * Validate that msg is an object and every key in schema matches the expected typeof string.
 * @param {unknown} msg
 * @param {Record<string, string>} schema  e.g. { name: 'string', ready: 'boolean' }
 * @returns {boolean}
 */
export function validate(msg, schema) {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return false;
  for (const [key, type] of Object.entries(schema)) {
    if (typeof msg[key] !== type) return false;
  }
  return true;
}

/**
 * Build a typed error payload (sent as the payload of an 'error' message).
 * @param {string} code
 * @param {string} message
 */
export function errorPayload(code, message) {
  return { code, message };
}
