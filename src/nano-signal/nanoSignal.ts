import { flattenObject, unflattenObject } from "./objectUtils";

/**
 * @fileoverview A lightweight reactive state management system with TypeScript support
 * @author nanoSignal Team
 * @version 1.0.0
 */

// ----------------------------------------------------
// Functional Version --- Better Performance
// ----------------------------------------------------

/**
 * Base interface for all signal objects
 * @template T The type of value stored in the signal
 */
interface SignalBase<T> {
  value: T;
}

/**
 * Interface for tracking signal changes and dependencies
 */
interface Changes {
  signalInstance: null;
  _signal?: SignalBase<any>;
}

/**
 * Type definition for effect functions that react to signal changes
 */
type EffectFunction = () => void;

/**
 * Global state for tracking which signal is currently being accessed
 */
const changes: Changes = { signalInstance: null };

/**
 * Registry of all effects associated with specific signals
 */
const effectsMap = new Map<SignalBase<any>, EffectFunction[]>();

/**
 * Records when a signal's value is accessed to track dependencies
 * 
 * @template T The type of the signal value
 * @param {SignalBase<T>} signal - The signal being accessed
 */
const _detectChange = <T>(signal: SignalBase<T>): void => {
  changes._signal = signal;
};
// ---- x ------------------------

/**
 * Executes all effect functions associated with a signal when its value changes
 * 
 * @template T The type of the signal value
 * @param {SignalBase<T>} signal - The signal whose value changed
 */
const _runEffects = <T>(signal: SignalBase<T>): void => {
  if (effectsMap.has(signal)) {
    for (let effectFn of effectsMap.get(signal)!) {
      effectFn();
    }
  }
};
// ---- x ------------------------

/**
 * Sets a signal's value with special handling for object values
 * 
 * @template T The type of the signal value
 * @param {SignalBase<T>} signal - The signal to update
 * @param {T} val - The new value to set
 * @returns {T} The updated value
 */
const _setSignalValue = <T>(signal: SignalBase<T>, val: T): T => {
  if (typeof val === "object" && val !== null) {
    signal.value = flattenObject(val) as T;
  } else {
    signal.value = val;
  }
  return signal.value;
};
// ---- x ------------------------

/**
 * Updates an object signal with partial changes
 * 
 * @template T The object type stored in the signal
 * @param {SignalBase<T>} signal - The signal to update
 * @param {Partial<T>} obj - The partial object with updates
 * @returns {boolean} Success indicator
 */
const _setSignalObject = <T extends object>(signal: SignalBase<T>, obj: Partial<T>): boolean => {
  const newValue = flattenObject(obj);
  _setSignalValue(signal, { ...signal.value, ...newValue } as T);
  return true;
};
// ---- x ------------------------

/**
 * Updates a signal value using various input types
 * 
 * @template T The type of the signal value
 * @param {SignalBase<T>} signal - The signal to update
 * @param {((val: T) => T | void) | Partial<T> | T} fnOrObj - A function, partial object, or direct value
 * @returns {boolean | T} Success indicator or updated value
 */
const set = <T>(
  signal: SignalBase<T>,
  fnOrObj: ((val: T) => T | void) | Partial<T> | T
): boolean | T => {
  if (typeof fnOrObj === "object" && fnOrObj !== null) {
    return _setSignalObject(signal as SignalBase<any>, fnOrObj as object);
  }

  if (typeof fnOrObj === "function") {
    const newValue = unflattenObject(signal.value as any);
    const returnValue = (fnOrObj as Function)(newValue);

    if (returnValue) return _setSignalObject(signal as SignalBase<any>, returnValue);
    _setSignalValue(signal, { ...signal.value, ...flattenObject(newValue) } as T);
    return true;
  }

  return _setSignalValue(signal, fnOrObj as T);
};

// ----------------------------------------------
// nanoSignal Function
// ----------------------------------------------

/**
 * Interface defining the public API of a nanoSignal
 * 
 * @template T The type of value stored in the signal
 */
export interface NanoSignal<T> {
  /**
   * Returns the current signal value when used in value contexts
   * 
   * @returns {T} The current value
   */
  valueOf: () => T;
  
  /**
   * The reactive value that tracks dependencies when accessed
   * and triggers updates when modified
   */
  value: T;
  
  /**
   * Updates the signal value using various input types
   * 
   * @param {((val: T) => T | void) | Partial<T> | T} fnOrObj - Function to transform the value,
   *                                                            partial object to merge, or direct value
   * @returns {any} Operation result (depends on the update type)
   */
  set: (fnOrObj: ((val: T) => T | void) | Partial<T> | T) => any;
}

/**
 * Creates a reactive signal with the given initial value
 * 
 * @template T The type of value to store
 * @param {T} initVal - The initial value for the signal
 * @returns {NanoSignal<T>} A reactive signal object
 * 
 * @example
 * // Basic counter
 * const count = nanoSignal(0);
 * count.value++; // Increments and triggers effects
 * 
 * // Object state
 * const user = nanoSignal({ name: 'John', age: 30 });
 * user.set({ age: 31 }); // Updates only the age property
 * 
 * // Using update function
 * count.set(val => val + 5);
 */
export const nanoSignal = <T>(initVal: T): NanoSignal<T> => {
  const _signal: SignalBase<T> = {
    value: initVal,
  };
  // ---- x ------------------------

  return {
    valueOf: function (): T {
      return _signal.value;
    },

    get value(): T {
      _detectChange(_signal);
      if (typeof _signal.value === "object" && _signal.value !== null)
        return unflattenObject(_signal.value as any) as T;
      return _signal.value;
    },

    set value(val: T) {
      _setSignalValue(_signal, val);
      _runEffects(_signal);
    },
    
    set: (fnOrObj: ((val: T) => T | void) | Partial<T> | T) => {
      return set(_signal, fnOrObj);
    }
  };
};

// ----------------------------------------------
// effect Function
// ----------------------------------------------

/**
 * Creates a reactive effect that automatically re-runs when accessed signals change
 * 
 * @param {EffectFunction} fn - The effect function to execute
 * 
 * @example
 * const count = nanoSignal(0);
 * const message = nanoSignal('');
 * 
 * effect(() => {
 *   message.value = `Count is ${count.value}`;
 *   console.log(message.value);
 * });
 * // Logs: "Count is 0"
 * 
 * count.value = 5;
 * // Automatically logs: "Count is 5"
 */
export const effect = (fn: EffectFunction): void => {
  fn();
  // Set Effects
  if (changes?._signal) {
    if (effectsMap.has(changes._signal)) {
      effectsMap.get(changes._signal)!.push(fn);
    }
    else {
      effectsMap.set(changes._signal, [fn]);
    }
    changes._signal = undefined;
  }
};

// ----------------------------------------------
// computed Function
// ----------------------------------------------

/**
 * Creates a derived signal that recomputes its value when dependencies change
 * 
 * @template T The type of the computed value
 * @param {() => T} fn - Function that computes the derived value
 * @returns {NanoSignal<T> | false} A read-only signal with the computed value,
 *                                  or false if fn is not a function
 * 
 * @example
 * const width = nanoSignal(5);
 * const height = nanoSignal(10);
 * 
 * const area = computed(() => width.value * height.value);
 * console.log(area.value); // 50
 * 
 * width.value = 7;
 * console.log(area.value); // 70 (automatically updated)
 */
export const computed = <T>(fn: () => T): NanoSignal<T> | false => {
  if (typeof fn === "function") {
    const _computedSignal = nanoSignal<T>(fn());
    effect(() => {
      _computedSignal.value = fn();
    });
    return _computedSignal;
  }
  return false;
};
// ---- x ------------------------

/**
 * Global type declarations to expose nanoSignal API on the window object
 */
declare global {
  interface Window {
    effectsMap: typeof effectsMap;
    nanoSignal: typeof nanoSignal;
    effect: typeof effect;
    computed: typeof computed;
  }
}

window.effectsMap = effectsMap;
window.nanoSignal = nanoSignal;
window.effect = effect;
window.computed = computed;