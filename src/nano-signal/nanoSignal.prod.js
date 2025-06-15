import { flattenObject, unflattenObject } from "./objectUtils"

// ----------------------------------------------------
// Functional Version --- Better Performance
// ----------------------------------------------------

/**
 * @typedef {object} SignalInstance
 * @property {*} value - The current value of the signal.
 */

/**
 * Stores the signal instance that was last accessed via its getter.
 * Used internally by the `effect` function to determine which signal triggered the effect.
 * @type {{_signal: SignalInstance | null}}
 */
const changes = { _signal: null }

/**
 * A map storing effects associated with signals.
 * Keys are signal instances, values are arrays of effect functions.
 * @type {Map<SignalInstance, Function[]>}
 */
const effectsMap = new Map()

/**
 * Detects a change by storing the accessed signal instance in the `changes` object.
 * This is called by the signal's getter.
 * @param {SignalInstance} signal - The signal instance that was accessed.
 * @private
 */
const _detectChange = (signal) => {
    changes._signal = signal
}

/**
 * Runs all effect functions associated with a given signal.
 * @param {SignalInstance} signal - The signal whose effects should be run.
 * @private
 */
const _runEffects = (signal) => {
    if (effectsMap.has(signal)) {
        for (let effectFn of effectsMap.get(signal)) {
            effectFn()
        }
    }
}

/**
 * Sets the internal value of a signal. If the value is an object, it is flattened.
 * @param {SignalInstance} signal - The signal instance to update.
 * @param {*} val - The new value for the signal.
 * @returns {*} The updated internal value of the signal.
 * @private
 */
const _setSignalValue = (signal, val) => {
    if (typeof val === "object" && val !== null) { // Added null check
        signal.value = flattenObject(val)
    } else {
        signal.value = val
    }
    return signal.value
}

/**
 * Sets the value of a signal using an object. The object is flattened and merged
 * with the existing flattened value.
 * @param {SignalInstance} signal - The signal instance to update.
 * @param {object} obj - The object containing values to merge into the signal.
 * @returns {boolean} Always returns true upon successful update.
 * @private
 */
const _setSignalObject = (signal, obj) => {
    const newValue = flattenObject(obj)
    // Ensure signal.value is treated as an object for spreading if it's not null/undefined
    const currentValue = typeof signal.value === 'object' && signal.value !== null ? signal.value : {};
    _setSignalValue(signal, { ...currentValue, ...newValue })
    return true
}

/**
 * Sets the value of a signal. Can accept a direct value, an object to merge,
 * or a function that receives the current unflattened value and returns a new value or object.
 * @param {SignalInstance} signal - The signal instance to update.
 * @param {*} fnOrObj - The new value, an object to merge, or a function.
 * @returns {*} The result of the update operation (true for object/function, the new value for direct value).
 */
const set = (signal, fnOrObj) => {
    if (typeof fnOrObj === "object" && fnOrObj !== null) { // Added null check
        return _setSignalObject(signal, fnOrObj)
    }

    if (typeof fnOrObj === "function") {
        const newValue = unflattenObject(signal.value)
        const returnValue = fnOrObj(newValue)

        // If the function returns a value, use it to set the signal
        if (returnValue !== undefined) { // Check for undefined return
             // If the return value is an object, merge it
            if (typeof returnValue === "object" && returnValue !== null) {
                 return _setSignalObject(signal, returnValue);
            } else {
                 // Otherwise, set the direct value
                 return _setSignalValue(signal, returnValue);
            }
        }
        // If the function modifies the object in place but returns nothing,
        // re-flatten and set the modified object.
        // Note: This assumes fnOrObj modifies newValue directly if it returns nothing.
        // If the function doesn't modify newValue and returns nothing, the signal won't change.
        _setSignalValue(signal, { ...flattenObject(newValue) }) // Re-flatten the potentially modified object
        return true // Indicate that the update process was handled
    }

    // Handle direct value assignment
    return _setSignalValue(signal, fnOrObj)
}


// ----------------------------------------------
// nanoSignal Function
// ----------------------------------------------

/**
 * Creates a new signal instance.
 * Signals are reactive containers for values that can trigger effects when changed.
 * If the initial value is an object, it is internally flattened.
 * @param {*} initVal - The initial value for the signal.
 * @returns {object} A signal object with `valueOf`, `value` getter/setter, and `set` method.
 */
export const nanoSignal = (initVal) => {
    /**
     * The internal representation of the signal.
     * @type {SignalInstance}
     * @private
     */
    const _signal = {
        value: initVal,
    }

    // Initialize the internal value, flattening if necessary
    _setSignalValue(_signal, initVal);


    return {
        /**
         * Returns the raw internal value of the signal.
         * @returns {*} The internal signal value.
         */
        valueOf: function () {
            return _signal.value;
        },

        /**
         * Gets the current value of the signal.
         * Accessing this getter registers the signal with the currently running effect.
         * If the internal value is a flattened object, it is unflattened before returning.
         * @returns {*} The current value of the signal.
         */
        get value() {
            _detectChange(_signal)
            if (typeof _signal.value === "object" && _signal.value !== null) return unflattenObject(_signal.value) // Added null check
            return _signal.value
        },

        /**
         * Sets the value of the signal.
         * If the new value is an object, it is flattened internally.
         * Setting the value triggers associated effects.
         * @param {*} val - The new value for the signal.
         */
        set value(val) {
            _setSignalValue(_signal, val)
            _runEffects(_signal)
        },

        /**
         * Sets the value of the signal using a value, an object to merge, or a function.
         * This method provides more flexible ways to update the signal compared to the setter.
         * @param {*} fnOrObj - The new value, an object to merge, or a function that receives the current value.
         * @returns {*} The result of the update operation.
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
 * Runs a function and automatically tracks which signals were accessed during its execution.
 * When any of the tracked signals change, the effect function is re-run.
 * @param {Function} fn - The function to run as an effect.
 */
export const effect = (fn) => {
    // Run the function initially
    fn()
    // Set Effects: If a signal was detected during the function run (_detectChange was called)
    if (changes?._signal) {
        if (effectsMap.has(changes._signal)) {
            effectsMap.get(changes._signal).push(fn)
        }
        else {
            effectsMap.set(changes._signal, [fn])
        }
        // Clear the detected signal for the next effect run
        changes._signal = null
    }
}

// ----------------------------------------------
// computed Function
// ----------------------------------------------

/**
 * Creates a signal whose value is derived from other signals.
 * The computed signal automatically updates when the signals it depends on change.
 * @param {Function} fn - A function that returns the computed value. This function should access other signals.
 * @returns {SignalInstance | boolean} A new signal instance representing the computed value, or false if the input is not a function.
 */
export const computed = (fn) => {
    if (typeof fn === "function") {
        // Create a signal to hold the computed value, initialized with the first result
        const _computedSignal = nanoSignal(fn())
        // Create an effect that updates the computed signal whenever its dependencies change
        effect(() => {
            _computedSignal.value = fn()
        })
        return _computedSignal
    }
    return false // Return false if the input is not a function
}

// ----------------------------------------------
// Expose to Window (for debugging/global access)
// ----------------------------------------------

/**
 * Exposes the internal effects map to the global window object for debugging.
 * @global
 * @type {Map<SignalInstance, Function[]>}
 */
window.effectsMap = effectsMap

/**
 * Exposes the nanoSignal function to the global window object.
 * @global
 * @type {function(*): object}
 */
window.nanoSignal = nanoSignal

/**
 * Exposes the effect function to the global window object.
 * @global
 * @type {function(Function): void}
 */
window.effect = effect

/**
 * Exposes the computed function to the global window object.
 * @global
 * @type {function(Function): SignalInstance | boolean}
 */
window.computed = computed
