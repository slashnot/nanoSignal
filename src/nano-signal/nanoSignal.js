import { flattenObject, unflattenObject } from "./objectUtils"


// ----------------------------------------------------
// Functional Version --- Better Performance
// ----------------------------------------------------
const changes = { signalInstance: null }
const effectsMap = new Map()

const _detectChange = (signal) => {
    changes._signal = signal
}
// ---- x ------------------------

const _runEffects = (signal) => {
    if (effectsMap.has(signal)) {
        for (let effectFn of effectsMap.get(signal)) {
            effectFn()
        }
    }
}
// ---- x ------------------------

const _setSignalValue = (signal, val) => {
    if (typeof value === "object") {
        signal.value = flattenObject(val)
    } else {
        signal.value = val
    }
    return signal.value
}
// ---- x ------------------------

const _setSignalObject = (signal, obj) => {
    const newValue = flattenObject(obj)
    _setSignalValue(signal, { ...signal.value, ...newValue })
    return true
}
// ---- x ------------------------

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
export const nanoSignal = (initVal) => {
    const _signal = {
        value: initVal,
    }
    // ---- x ------------------------

    return {
        valueOf: function () {
            return _signal.value;
        },

        get value() {
            _detectChange(_signal)
            if (typeof _signal.value === "object") return unflattenObject(_signal.value)
            return _signal.value
        },

        set value(val) {
            _setSignalValue(_signal, val)
            _runEffects(_signal)
        },
        set: (fnOrObj) => {
            return set(_signal, fnOrObj)
        }
    }
}

// ----------------------------------------------
// effect Function
// ----------------------------------------------
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

window.effectsMap = effectsMap
window.nanoSignal = nanoSignal
window.effect = effect
window.computed = computed
