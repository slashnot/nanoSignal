import { flattenObject, unflattenObject } from "./objectUtils";

// ----------------------------------------------------
// Functional Version --- Better Performance
// ----------------------------------------------------

/**
 * @typedef {object} SignalInstance
 * @property {*} value - The current value of the signal.
 */
interface SignalInstance<T = any> {
    value: T;
}

/**
 * Stores the signal instance that was last accessed via its getter.
 * Used internally by the `effect` function to determine which signal triggered the effect.
 * @type {{_signal: SignalInstance | null}}
 */
const changes: { _signal: SignalInstance | null } = { _signal: null };

/**
 * A map storing effects associated with signals.
 * Keys are signal instances, values are arrays of effect functions.
 * @type {Map<SignalInstance, Function[]>}
 */
const effectsMap: Map<SignalInstance, Function[]> = new Map();

/**
 * Detects a change by storing the accessed signal instance in the `changes` object.
 * This is called by the signal's getter.
 * @param {SignalInstance} signal - The signal instance that was accessed.
 * @private
 */
const _detectChange = (signal: SignalInstance): void => {
    changes._signal = signal;
};

/**
 * Runs all effect functions associated with a given signal.
 * @param {SignalInstance} signal - The signal whose effects should be run.
 * @private
 */
const _runEffects = (signal: SignalInstance): void => {
    if (effectsMap.has(signal)) {
        const effects = effectsMap.get(signal);
        if (effects) { // Ensure effects is not undefined, though Map.has implies it won't be
            for (let effectFn of effects) {
                effectFn();
            }
        }
    }
};

/**
 * Sets the internal value of a signal. If the value is an object, it is flattened.
 * @param {SignalInstance} signal - The signal instance to update.
 * @param {*} val - The new value for the signal.
 * @returns {*} The updated internal value of the signal.
 * @private
   */
const _setSignalValue = <T>(signal: SignalInstance<T>, val: T): T => {
    if (typeof val === "object" && val !== null) {
        signal.value = flattenObject(val) as T;
    } else {
        signal.value = val;
    }
    return signal.value;
};

/**
 * Sets the value of a signal using an object. The object is flattened and merged
   * with the existing flattened value.
   * @param {SignalInstance<object>} signal - The signal instance to update (assuming it holds an object).
   * @param {{ [key: string]: any }} obj - The object containing values to merge into the signal.
   * @returns {boolean} Always returns true upon successful update.
   * @private
   */
const _setSignalObject = (signal: SignalInstance<object>, obj: { [key: string]: any }): boolean => {
    const newValue = flattenObject(obj);
    const currentValue = typeof signal.value === 'object' && signal.value !== null ? signal.value : {};
    _setSignalValue(signal, { ...(currentValue as object), ...(newValue as object) } as object);
    return true;
};
/**
* Sets the value of a signal. Can accept a direct value, an object to merge,
* or a function that receives the current unflattened value and returns a new value or object.
* @param {SignalInstance} signal - The signal instance to update.
* @param {*} fnOrObj - The new value, an object to merge, or a function.
* @returns {*} The result of the update operation (true for object/function, the new value for direct value).
*/
const set = <T>(signal: SignalInstance<T>, fnOrObj: T | object | ((currentValue: any) => T | object | void)): T | boolean => {
    if (typeof fnOrObj === "object" && fnOrObj !== null) {
        return _setSignalObject(signal as SignalInstance<object>, fnOrObj);
    }
    if (typeof fnOrObj === "function") {
        const newValue = unflattenObject(signal.value);
        const returnValue = (fnOrObj as (currentValue: any) => T | object | void)(newValue);
        if (returnValue !== undefined) {
            if (typeof returnValue === "object" && returnValue !== null) {
                return _setSignalObject(signal as SignalInstance<object>, returnValue);
            } else {
                return _setSignalValue(signal, returnValue as T);
            }
        }
        _setSignalValue(signal, { ...flattenObject(newValue) } as T);
        return true;
    }

    return _setSignalValue(signal, fnOrObj);
};
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
export const nanoSignal = <T>(initVal: T): {
    valueOf: () => T;
    value: T;
    set: (fnOrObj: T | object | ((currentValue: any) => T | object | void)) => T | boolean;
} => {
    const _signal: SignalInstance<T> = {
        value: initVal,
    };

    _setSignalValue(_signal, initVal);
    return {
        valueOf: function (): T {
            return _signal.value;
        },

        get value(): T {
            _detectChange(_signal);
            if (typeof _signal.value === "object" && _signal.value !== null) return unflattenObject(_signal.value) as T;
            return _signal.value;
        },

        set value(val: T) {
            _setSignalValue(_signal, val);
            _runEffects(_signal);
        },

        set: (fnOrObj: T | object | ((currentValue: any) => T | object | void)): T | boolean => {
            return set(_signal, fnOrObj);
        }
    };
};

// ----------------------------------------------
// effect Function
// ----------------------------------------------

/**
 * Runs a function and automatically tracks which signals were accessed during its execution.
 * When any of the tracked signals change, the effect function is re-run.
 * @param {Function} fn - The function to run as an effect.
   */
export const effect = (fn: () => void): void => {
    fn();
    if (changes?._signal) {
        if (effectsMap.has(changes._signal)) {
            effectsMap.get(changes._signal)!.push(fn);
        }
        else {
            effectsMap.set(changes._signal, [fn]);
        }
        changes._signal = null;
    }
};

// ----------------------------------------------
// computed Function
// ----------------------------------------------

/**
 * Creates a signal whose value is derived from other signals.
 * The computed signal automatically updates when the signals it depends on change.
 * @param {Function} fn - A function that returns the computed value. This function should access other signals.
 * @returns {SignalInstance | boolean} A new signal instance representing the computed value, or false if the input is not a function.
 */
export const computed = <T>(fn: () => T): SignalInstance<T> | false => {
    if (typeof fn === "function") {
        const _computedSignal = nanoSignal(fn());
        effect(() => {
            _computedSignal.value = fn();
        });
        return _computedSignal;
    }
    return false;
};

// ----------------------------------------------
// Expose to Window (for debugging/global access)
// ----------------------------------------------

// Extend the Window interface to include the properties we are adding
declare global {
    interface Window {
        effectsMap: Map<SignalInstance, Function[]>;
        nanoSignal: typeof nanoSignal;
        effect: typeof effect;
        computed: typeof computed;
    }
}

/**
 * Exposes the internal effects map to the global window object for debugging.
 * @global
 * @type {Map<SignalInstance, Function[]>}
 */
window.effectsMap = effectsMap;

/**
 * Exposes the nanoSignal function to the global window object.
 * @global
 * @type {function(*): object}
 */
window.nanoSignal = nanoSignal;

/**
 * Exposes the effect function to the global window object.
 * @global
 * @type {function(Function): void}
 */
window.effect = effect;

/**
 * Exposes the computed function to the global window object.
 * @global
 * @type {function(Function): SignalInstance | boolean}
 */
window.computed = computed;
