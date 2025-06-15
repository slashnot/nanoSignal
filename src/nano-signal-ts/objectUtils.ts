/* ---------------------------------------------------------------------
OBJECT FLATTEN AND UNFLATTEN UTILS
// --------------------------------------------------------------------- */

/**
 * Flattens an object, including handling arrays and preserving functions with a marker.
 * @param {object} obj - The object to flatten.
 * @param {string} [parentKey=''] - The base key for the current level (used in recursion).
 * @param {string} [separator='.'] - The separator to use for nested keys.
 * @returns {object} The flattened object.
 */
export const flattenObject = (obj: any, parentKey: string = '', separator: string = '.'): { [key: string]: any } => {
  let flattened: { [key: string]: any } = {};

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
      flattened[currentKey] = { __function__: value.toString() };
    } else {
      // Add regular values to the flattened object
      flattened[currentKey] = value;
    }
  }

  return flattened;
};

/**
 * Unflattens an object created by `flattenObject`, reconstructing nested objects, arrays, and functions.
 * @param {object} flattened - The flattened object.
 * @param {string} [separator='.'] - The separator used for nested keys.
 * @returns {object} The unflattened object.
 */
export const unflattenObject = (flattened: object, separator: string = '.'): any => {
  const result: any = {};
  const arrayRegex = /^(.*)\[(\d+)\]$/;

  for (const key in flattened) {
    if (!Object.prototype.hasOwnProperty.call(flattened, key)) continue;

    const value = flattened[key];
    let path = key.split(separator);
    let current = result;

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
          if (typeof value === 'object' && value !== null && value.__function__) {
            current[part][index] = new Function('return ' + value.__function__)();
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
          if (typeof value === 'object' && value !== null && value.__function__) {
            current[part] = new Function('return ' + value.__function__)();
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

// The original JS file also contained flattenObjectWithArray, unflattenObjectWithArray,
// flattenObjectWithFn, and unflattenObjectWithFn. I will include these in the TS file
// with appropriate types as well.

/**
 * Flattens an object, handling arrays but not preserving functions.
 * @param {object} obj - The object to flatten.
 * @param {string} [parentKey=''] - The base key for the current level (used in recursion).
 * @param {string} [separator='.'] - The separator to use for nested keys.
 * @returns {object} The flattened object.
 */
export const flattenObjectWithArray = (obj: any, parentKey: string = '', separator: string = '.'): { [key: string]: any } => {
  let flattened: { [key: string]: any } = {};

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

/**
 * Unflattens an object created by `flattenObjectWithArray`, reconstructing nested objects and arrays.
 * @param {object} flattened - The flattened object.
 * @param {string} [separator='.'] - The separator used for nested keys.
 * @returns {object} The unflattened object.
 */
export const unflattenObjectWithArray = (flattened: { [key: string]: any }, separator: string = '.'): any => {
  const result: any = {};

  for (const key in flattened) {
    if (!Object.prototype.hasOwnProperty.call(flattened, key)) continue;

    const keys = key.split(separator);
    let current = result;

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

/**
 * Flattens an object, preserving functions with a marker but not handling arrays specifically.
 * @param {object} obj - The object to flatten.
 * @param {string} [parentKey=''] - The base key for the current level (used in recursion).
 * @param {string} [separator='.'] - The separator to use for nested keys.
 * @returns {object} The flattened object.
 */
export const flattenObjectWithFn = (obj: any, parentKey: string = '', separator: string = '.'): { [key: string]: any } => {
  let flattened: { [key: string]: any } = {};

  for (let key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const newKey = parentKey ? `${parentKey}${separator}${key}` : key;
    const value = obj[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenObjectWithFn(value, newKey, separator));
    } else if (typeof value === 'function') {
      // Store functions with a special marker
      flattened[newKey] = { __function__: value.toString() };
    } else {
      // Add regular values to the flattened object
      flattened[newKey] = value;
    }
  }

  return flattened;
};

/**
 * Unflattens an object created by `flattenObjectWithFn`, reconstructing nested objects and functions.
 * @param {object} flattened - The flattened object.
 * @param {string} [separator='.'] - The separator used for nested keys.
 * @returns {object} The unflattened object.
 */
export const unflattenObjectWithFn = (flattened: { [key: string]: any }, separator: string = "."): any => {
  const result: any = {}

  for (const key in flattened) {
    if (!Object.prototype.hasOwnProperty.call(flattened, key)) continue

    const keys = key.split(separator)
    let current = result
    const value = flattened[key]

    for (let i = 0; i < keys.length; i++) {
      const part = keys[i]

      if (i === keys.length - 1) {
        // Handle function reconstruction
        if (typeof value === "object" && value !== null && value.__function__) {
          current[part] = new Function("return " + value.__function__)()
        } else {
          current[part] = value
        }
      } else {
        if (!current[part] || typeof current[part] !== "object") {
          current[part] = {}
        }
        current = current[part]
      }
    }
  }

  return result
}
