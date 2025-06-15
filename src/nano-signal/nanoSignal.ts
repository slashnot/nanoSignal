import { flattenObject, unflattenObject } from "./objectUtils";

// ----------------------------------------------------
// Functional Version --- Better Performance
// ----------------------------------------------------
interface SignalBase<T> {
  value: T;
}

interface Changes {
  signalInstance: null;
  _signal?: SignalBase<any>;
}

type EffectFunction = () => void;

const changes: Changes = { signalInstance: null };
const effectsMap = new Map<SignalBase<any>, EffectFunction[]>();

const _detectChange = <T>(signal: SignalBase<T>): void => {
  changes._signal = signal;
};
// ---- x ------------------------

const _runEffects = <T>(signal: SignalBase<T>): void => {
  if (effectsMap.has(signal)) {
    for (let effectFn of effectsMap.get(signal)!) {
      effectFn();
    }
  }
};
// ---- x ------------------------

const _setSignalValue = <T>(signal: SignalBase<T>, val: T): T => {
  if (typeof val === "object" && val !== null) {
    signal.value = flattenObject(val) as T;
  } else {
    signal.value = val;
  }
  return signal.value;
};
// ---- x ------------------------

const _setSignalObject = <T extends object>(signal: SignalBase<T>, obj: Partial<T>): boolean => {
  const newValue = flattenObject(obj);
  _setSignalValue(signal, { ...signal.value, ...newValue } as T);
  return true;
};
// ---- x ------------------------

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
 * Creates a nanoSignal object for reactive state management.
 *
 * @template T
 * @param {T} initVal - The initial value of the signal.
 * @returns {{
 *   valueOf: () => T,
 *   value: T,
 *   set value(val: T),
 *   set: (fnOrObj: ((val: T) => T | void) | Partial<T> | T) => any
 * }} An object with reactive value accessors and mutators.
 *
 * @example
 * const signal = nanoSignal(0);
 * signal.value = 5;
 * console.log(signal.value); // 5
 * signal.set(val => val + 1);
 */
export interface NanoSignal<T> {
  valueOf: () => T;
  value: T;
  set: (fnOrObj: ((val: T) => T | void) | Partial<T> | T) => any;
}

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