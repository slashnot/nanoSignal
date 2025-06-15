import { flattenObject, unflattenObject } from "./objectUtils"

const changes = { signalInstance: null }

// ----------------------------------------------------
// Class Version
// ----------------------------------------------------
// export const effect = (fn) => {
//     fn()
//     // Set Effects
//     if (changes?.signalInstance) {
//         changes.signalInstance.addEffect(fn)
//         changes.signalInstance = null
//     }
// }
// // ---- x ------------------------

// class NanoSignal {
//     constructor(initSignal) {
//         this._signal = initSignal
//         this._effects = []
//     }
//     // ---- x ------------------------

//     addEffect = (fn) => {
//         this._effects.push(fn)
//         console.log(this._effects)
//     }
//     // ---- x ------------------------

//     _detectChange = () => {
//         changes.signalInstance = this
//     }
//     // ---- x ------------------------

//     _runEffects = () => {
//         for (let effect of this._effects) {
//             effect()
//         }
//     }
//     // ---- x ------------------------
//     _setSignalValue = val => {
//         if (typeof value === "object") {
//             this._signal.value = flattenObject(val)
//         } else {
//             this._signal.value = val
//         }
//         return this._signal.value
//     }
//     // ---- x ------------------------

//     _setSignalObject = obj => {
//         const newValue = flattenObject(obj)
//         this._setSignalValue({ ...this._signal.value, ...newValue })
//         return true
//     }
//     // ---- x ------------------------

//     set = fnOrObj => {
//         if (typeof fnOrObj === "object") {
//             return this._setSignalObject(fnOrObj)
//         }

//         if (typeof fnOrObj === "function") {
//             const newValue = unflattenObject(this._signal.value)
//             const returnValue = fnOrObj(newValue)

//             if (returnValue) return this._setSignalObject(returnValue)
//             this._setSignalValue({ ...this._signal.value, ...flattenObject(newValue) })
//             return true
//         }

//         return this._setSignalValue(fnOrObj)
//     }
//     // ---- x ------------------------

//     valueOf() {
//         return this._signal.value;
//     }

//     get value() {
//         this._detectChange(this._signal)
//         if (typeof this._signal.value === "object") return unflattenObject(this._signal.value)
//         return this._signal.value
//     }

//     set value(v) {
//         this._setSignalValue(v)
//         this._runEffects(this)
//     }
// }

// export const nanoSignal = (initVal) => {
//     return new NanoSignal({
//         value: initVal,
//     })
// }



// ----------------------------------------------------
// Functional Version --- Better Performance
// ----------------------------------------------------
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
