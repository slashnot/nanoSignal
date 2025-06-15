import { flattenObject, unflattenObject } from "./objectUtils"

/**
 * @fileoverview A lightweight reactive state management system
 * @author nanoSignal Team
 * @version 1.0.0
 */

// ----------------------------------------------------
// Functional Version --- Better Performance
// ----------------------------------------------------

/**
 * Global store for tracking changes and signal dependencies
 * @type {{signalInstance: null, _signal: Object|null}}
 */
const changes = { signalInstance: null }

/**
 * Map to track effects that depend on signals
 * @type {Map<Object, Array<Function>>}
 */
const effectsMap = new Map()

/**
 * Records a signal access to track dependencies
 * @param {Object} signal - The signal object being accessed
 * @private
 */
const _detectChange = (signal) => {
    changes._signal = signal
}
// ---- x ------------------------

/**
 * Executes all effect functions that depend on the given signal
 * @param {Object} signal - The signal object that changed
 * @private
 */
const _runEffects = (signal) => {
    if (effectsMap.has(signal)) {
        for (let effectFn of effectsMap.get(signal)) {
            effectFn()
        }
    }
}
// ---- x ------------------------

/**
 * Sets a signal's value with proper handling for objects
 * @param {Object} signal - The signal object to modify
 * @param {*} val - The new value to set
 * @returns {*} The updated value
 * @private
 */
const _setSignalValue = (signal, val) => {
    if (typeof value === "object") {
        signal.value = flattenObject(val)
    } else {
        signal.value = val
    }
    return signal.value
}
// ---- x ------------------------

/**
 * Sets a signal's value when the new value is an object
 * @param {Object} signal - The signal object to modify
 * @param {Object} obj - The object to merge into the signal's value
 * @returns {boolean} Success indicator
 * @private
 */
const _setSignalObject = (signal, obj) => {
    const newValue = flattenObject(obj)
    _setSignalValue(signal, { ...signal.value, ...newValue })
    return true
}
// ---- x ------------------------

/**
 * Updates a signal's value based on the provided function or object
 * @param {Object} signal - The signal object to modify
 * @param {Function|Object|*} fnOrObj - A function that transforms the current value, 
 *                                     an object to merge, or a direct value to set
 * @returns {boolean|*} Success indicator or updated value
 * @private
 */
const set = (signal, fnOrObj) => {
    if (typeof fnOrObj === "object") {
        return _setSignalObject(signal, fnOrObj)
    }

    if (typeof fnOrObj === "function") {
        const newValue = unflattenObject(signal.value)
        const returnValue = fnOrObj(newValue)

        if (returnValue) return _setSignalObject(returnValue)
        _setSignalValue(signal, { ...signal.value, ...flattenObject(newValue) })
        return true
    }

    return _setSignalValue(signal, fnOrObj)
}


// ----------------------------------------------
// nanoSignal Function
// ----------------------------------------------

/**
 * Creates a reactive signal with the given initial value
 * @param {*} initVal - The initial value for the signal
 * @returns {Object} A signal object with reactive getter/setter and utility methods
 * @example
 * // Create a simple counter signal
 * const count = nanoSignal(0);
 * console.log(count.value); // 0
 * count.value = 1;
 * console.log(count.value); // 1
 * 
 * // Update with a function
 * count.set(val => val + 1);
 * console.log(count.value); // 2
 * 
 * // Update with an object (for object signals)
 * const user = nanoSignal({ name: "John", age: 30 });
 * user.set({ age: 31 }); // Only updates the age property
 */
export const nanoSignal = (initVal) => {
    /**
     * Internal signal state
     * @type {Object}
     * @private
     */
    const _signal = {
        value: initVal,
    }
    // ---- x ------------------------

    return {
        /**
         * Returns the signal's current value when used in value contexts
         * @returns {*} The current value
         */
        valueOf: function () {
            return _signal.value;
        },

        /**
         * Gets the signal's current value and tracks the access for reactivity
         * @returns {*} The current value, unflattened if it's an object
         */
        get value() {
            _detectChange(_signal)
            if (typeof _signal.value === "object") return unflattenObject(_signal.value)
            return _signal.value
        },

        /**
         * Sets a new value and triggers reactive updates
         * @param {*} val - The new value to set
         */
        set value(val) {
            _setSignalValue(_signal, val)
            _runEffects(_signal)
        },
        
        /**
         * Updates the signal value using a function or object
         * @param {Function|Object|*} fnOrObj - Function, object or value to update with
         * @returns {*} Result of the update operation
         */
        set: (fnOrObj) => {
            return set(_signal, fnOrObj)
        }
    }
}

// ----------------------------------------------
// effect Function
// ----------------------------------------------

/**
 * Creates a reactive effect that automatically re-runs when its dependencies change
 * @param {Function} fn - The effect function to execute
 * @example
 * const count = nanoSignal(0);
 * effect(() => {
 *   console.log(`Count is now: ${count.value}`);
 * });
 * // Logs: "Count is now: 0" immediately
 * 
 * count.value = 1;
 * // Logs: "Count is now: 1" reactively
 */
export const effect = (fn) => {
    fn()
    // Set Effects
    if (changes?._signal) {
        if (effectsMap.has(changes._signal)) {
            effectsMap.get(changes._signal).push(fn)
        }
        else {
            effectsMap.set(changes._signal, [fn])
        }
        changes._signal = null
    }
}

// ----------------------------------------------
// computed Function
// ----------------------------------------------

/**
 * Creates a derived signal that recomputes its value when dependencies change
 * @param {Function} fn - Function that computes the derived value
 * @returns {Object|boolean} A read-only signal or false if fn is not a function
 * @example
 * const count = nanoSignal(0);
 * const doubleCount = computed(() => count.value * 2);
 * 
 * console.log(doubleCount.value); // 0
 * count.value = 5;
 * console.log(doubleCount.value); // 10
 */
export const computed = (fn) => {
    if (typeof fn === "function") {
        const _computedSignal = nanoSignal(fn())
        effect(() => {
            _computedSignal.value = fn()
        })
        return _computedSignal
    }
    return false
}
// ---- x ------------------------

/**
 * Expose the API globally for debugging purposes
 * @private
 */
window.effectsMap = effectsMap
window.nanoSignal = nanoSignal
window.effect = effect
window.computed = computed
