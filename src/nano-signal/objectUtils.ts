/**
 * @fileoverview Utilities for flattening and unflattening nested objects
 * @author nanoSignal Team
 * @version 1.0.0
 */

/* ---------------------------------------------------------------------
OBJECT FLATTEN AND UNFLATTEN UTILS
// --------------------------------------------------------------------- */

/**
 * Type for flattened object with string keys and any values
 */
type FlattenedObject = Record<string, any>;

/**
 * Type for nested object with string keys and any values
 */
type NestedObject = Record<string, any>;

/**
 * Type for marking serialized functions in flattened objects
 */
type FunctionMarker = { __function__: string };

/**
 * Flattens a nested object with array support, preserving only non-object values
 * 
 * @param {NestedObject} obj - The nested object to flatten
 * @param {string} parentKey - Key prefix for nested properties (used in recursion)
 * @param {string} separator - Character to separate nested keys (default '.')
 * @returns {FlattenedObject} A flattened object with dot-notation keys
 * 
 * @example
 * flattenObjectWithArray({ user: { name: 'John', scores: [10, 20] } });
 * // Returns: { 'user.name': 'John', 'user.scores[0]': 10, 'user.scores[1]': 20 }
 */
export const flattenObjectWithArray = (
  obj: NestedObject,
  parentKey: string = '',
  separator: string = '.'
): FlattenedObject => {
  let flattened: FlattenedObject = {};

  for (let key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const newKey = parentKey ? `${parentKey}${separator}${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenObjectWithArray(obj[key], newKey, separator));
    } else {
      // Add the value to the flattened object
      flattened[newKey] = obj[key];
    }
  }

  return flattened;
};
// ---- x ---------------------------------------------------------------

/**
 * Reconstructs a nested object from a flattened object with array support
 * 
 * @param {FlattenedObject} flattened - The flattened object to unflatten
 * @param {string} separator - Character that separates nested keys (default '.')
 * @returns {NestedObject} A reconstructed nested object
 * 
 * @example
 * unflattenObjectWithArray({
 *   'user.name': 'John',
 *   'user.scores[0]': 10,
 *   'user.scores[1]': 20
 * });
 * // Returns: { user: { name: 'John', scores: [10, 20] } }
 */
export const unflattenObjectWithArray = (
  flattened: FlattenedObject, 
  separator: string = '.'
): NestedObject => {
  const result: NestedObject = {};

  for (const key in flattened) {
    if (!Object.prototype.hasOwnProperty.call(flattened, key)) continue;

    const keys = key.split(separator);
    let current: NestedObject = result;

    for (let i = 0; i < keys.length; i++) {
      const part = keys[i];

      // If we're at the last part, set the value
      if (i === keys.length - 1) {
        current[part] = flattened[key];
      }
      // Otherwise, prepare the nested structure
      else {
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }

  return result;
};
// ---- x ---------------------------------------------------------------

/**
 * Flattens a nested object with function serialization support
 * 
 * @param {NestedObject} obj - The nested object to flatten
 * @param {string} parentKey - Key prefix for nested properties (used in recursion)
 * @param {string} separator - Character to separate nested keys (default '.')
 * @returns {FlattenedObject} A flattened object with serialized functions
 * 
 * @example
 * flattenObjectWithFn({
 *   user: {
 *     name: 'John',
 *     greet: function() { return `Hello ${this.name}`; }
 *   }
 * });
 * // Returns: {
 * //   'user.name': 'John',
 * //   'user.greet': { __function__: 'function() { return `Hello ${this.name}`; }' }
 * // }
 */
export const flattenObjectWithFn = (
  obj: NestedObject, 
  parentKey: string = '', 
  separator: string = '.'
): FlattenedObject => {
  let flattened: FlattenedObject = {};

  for (let key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const newKey = parentKey ? `${parentKey}${separator}${key}` : key;
    const value = obj[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenObjectWithFn(value, newKey, separator));
    } else if (typeof value === 'function') {
      // Store functions with a special marker
      flattened[newKey] = { __function__: value.toString() } as FunctionMarker;
    } else {
      // Add regular values to the flattened object
      flattened[newKey] = value;
    }
  }

  return flattened;
};
// ---- x ---------------------------------------------------------------

/**
 * Reconstructs a nested object from a flattened object with function reconstruction
 * 
 * @param {FlattenedObject} flattened - The flattened object to unflatten
 * @param {string} separator - Character that separates nested keys (default '.')
 * @returns {NestedObject} A reconstructed nested object with functions
 * 
 * @example
 * unflattenObjectWithFn({
 *   'user.name': 'John',
 *   'user.greet': { __function__: 'function() { return `Hello ${this.name}`; }' }
 * });
 * // Returns: {
 * //   user: {
 * //     name: 'John',
 * //     greet: function() { return `Hello ${this.name}`; }
 * //   }
 * // }
 */
export const unflattenObjectWithFn = (
  flattened: FlattenedObject, 
  separator: string = "."
): NestedObject => {
  const result: NestedObject = {};

  for (const key in flattened) {
    if (!Object.prototype.hasOwnProperty.call(flattened, key)) continue;

    const keys = key.split(separator);
    let current: NestedObject = result;
    const value = flattened[key];

    for (let i = 0; i < keys.length; i++) {
      const part = keys[i];

      if (i === keys.length - 1) {
        // Handle function reconstruction
        if (
          typeof value === "object" && 
          value !== null && 
          '__function__' in value
        ) {
          // Safe way to handle the Function constructor in TypeScript
          current[part] = new Function("return " + (value as FunctionMarker).__function__)();
        } else {
          current[part] = value;
        }
      } else {
        if (!current[part] || typeof current[part] !== "object") {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }

  return result;
};
// ---- x ---------------------------------------------------------------

/**
 * Comprehensive flatten function that supports both arrays and functions
 * 
 * @param {NestedObject} obj - The nested object to flatten
 * @param {string} parentKey - Key prefix for nested properties (used in recursion)
 * @param {string} separator - Character to separate nested keys (default '.')
 * @returns {FlattenedObject} A flattened object with array indices and serialized functions
 * 
 * @example
 * flattenObject({
 *   user: {
 *     name: 'John',
 *     scores: [10, 20],
 *     calculate: function() { return this.scores.reduce((a, b) => a + b, 0); }
 *   }
 * });
 * // Returns: {
 * //   'user.name': 'John',
 * //   'user.scores[0]': 10,
 * //   'user.scores[1]': 20,
 * //   'user.calculate': { __function__: 'function() { return this.scores.reduce((a, b) => a + b, 0); }' }
 * // }
 */
export const flattenObject = (
  obj: NestedObject, 
  parentKey: string = '', 
  separator: string = '.'
): FlattenedObject => {
  let flattened: FlattenedObject = {};

  for (let key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const currentKey = parentKey ? `${parentKey}${separator}${key}` : key;
    const value = obj[key];

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // Handle array elements with [index] notation
        for (let i = 0; i < value.length; i++) {
          const arrayKey = `${currentKey}[${i}]`;
          if (typeof value[i] === 'object' && value[i] !== null) {
            Object.assign(flattened, flattenObject(value[i], arrayKey, separator));
          } else {
            flattened[arrayKey] = value[i];
          }
        }
      } else {
        // Recursively flatten regular objects
        Object.assign(flattened, flattenObject(value, currentKey, separator));
      }
    } else if (typeof value === 'function') {
      // Store functions with a special marker
      flattened[currentKey] = { __function__: value.toString() } as FunctionMarker;
    } else {
      // Add regular values to the flattened object
      flattened[currentKey] = value;
    }
  }

  return flattened;
};
// ---- x ---------------------------------------------------------------

/**
 * Comprehensive unflatten function that supports both arrays and functions
 * 
 * @param {FlattenedObject} flattened - The flattened object to unflatten
 * @param {string} separator - Character that separates nested keys (default '.')
 * @returns {NestedObject} A reconstructed nested object with arrays and functions
 * 
 * @example
 * unflattenObject({
 *   'user.name': 'John',
 *   'user.scores[0]': 10,
 *   'user.scores[1]': 20,
 *   'user.calculate': { __function__: 'function() { return this.scores.reduce((a, b) => a + b, 0); }' }
 * });
 * // Returns: {
 * //   user: {
 * //     name: 'John',
 * //     scores: [10, 20],
 * //     calculate: function() { return this.scores.reduce((a, b) => a + b, 0); }
 * //   }
 * // }
 */
export const unflattenObject = (
  flattened: FlattenedObject, 
  separator: string = '.'
): NestedObject => {
  const result: NestedObject = {};
  const arrayRegex = /^(.*)\[(\d+)\]$/;

  for (const key in flattened) {
    if (!Object.prototype.hasOwnProperty.call(flattened, key)) continue;

    const value = flattened[key];
    let path = key.split(separator);
    let current: NestedObject = result;

    for (let i = 0; i < path.length; i++) {
      let part = path[i];
      const arrayMatch = part.match(arrayRegex);

      if (arrayMatch) {
        // Handle array indices
        part = arrayMatch[1];
        const index = parseInt(arrayMatch[2]);

        if (!current[part]) {
          current[part] = [];
        }

        if (i === path.length - 1) {
          // Handle function reconstruction for array elements
          if (
            typeof value === 'object' && 
            value !== null && 
            '__function__' in value
          ) {
            current[part][index] = new Function('return ' + (value as FunctionMarker).__function__)();
          } else {
            current[part][index] = value;
          }
        } else {
          if (!current[part][index] || typeof current[part][index] !== 'object') {
            current[part][index] = {};
          }
          current = current[part][index];
        }
      } else {
        if (i === path.length - 1) {
          // Handle function reconstruction
          if (
            typeof value === 'object' && 
            value !== null && 
            '__function__' in value
          ) {
            current[part] = new Function('return ' + (value as FunctionMarker).__function__)();
          } else {
            current[part] = value;
          }
        } else {
          if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {};
          }
          current = current[part];
        }
      }
    }
  }

  return result;
};
// ---- x ---------------------------------------------------------------