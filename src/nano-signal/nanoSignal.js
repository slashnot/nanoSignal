import { flattenObject, unflattenObject } from "./objectUtils"


// ----------------------------------------------------
// Functional Version --- Better Performance
// ----------------------------------------------------
const changes = { signalInstance: null }
const effectsMap = new Map()
const computedMap = new Map()

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
// ---- x ------------------------

const _detectChange = (signal) => {
    changes._signal = signal
}
// ---- x ------------------------

const _runEffects = (signal) => {
    for (let effect of effectsMap.get(signal)) {
        effect()
    }
}
// ---- x ------------------------

const _runComputedEffects = (signal) => {
    // for (let effect of computedMap.get(signal)) {
    //     signal.value = effect()
    console.log("run computed effects", computedMap.get(signal))
    // }
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
            _runComputedEffects(_signal)
        },
        set: (fnOrObj) => {
            return set(_signal, fnOrObj)
        }
    }
}

export const computed = (fn) => {
    const _computedSignal = nanoSignal(fn())

    // Set computed effects
    if (changes?._signal) {
        if (computedMap.has(changes._signal)) {
            computedMap.get(changes._signal).push(fn)
        }
        else {
            computedMap.set(changes._signal, [fn])
        }
        changes._signal = null
    }

    return _computedSignal
}

window.effectsMap = effectsMap
window.computedMap = computedMap
