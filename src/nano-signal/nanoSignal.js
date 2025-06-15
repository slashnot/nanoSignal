import { flattenObject, unflattenObject } from "./objectUtils"

const changes = { signalInstance: null }
export const effect = (fn) => {
    fn()
    // Set Effects
    if (changes?.signalInstance) {
        changes.signalInstance.addEffect(fn)
        changes.signalInstance = null
    }
}

// ----------------------------------------------------
// NanoSignal Class
// ----------------------------------------------------
class NanoSignal {
    constructor(initSignal) {
        this._signal = initSignal
        this._effects = []
    }
    // ---- x ------------------------

    addEffect = (fn) => {
        this._effects.push(fn)
        console.log(this._effects)
    }
    // ---- x ------------------------

    _detectChange = () => {
        changes.signalInstance = this
    }
    // ---- x ------------------------

    _runEffects = () => {
        for (let effect of this._effects) {
            effect()
        }
    }
    // ---- x ------------------------
    _setSignalValue = val => {
        if (typeof value === "object") {
            this._signal.value = flattenObject(val)
        } else {
            this._signal.value = val
        }
        return this._signal.value
    }
    // ---- x ------------------------

    _setSignalObject = obj => {
        const newValue = flattenObject(obj)
        this._setSignalValue({ ...this._signal.value, ...newValue })
        return true
    }
    // ---- x ------------------------

    set = fnOrObj => {
        if (typeof fnOrObj === "object") {
            return this._setSignalObject(fnOrObj)
        }

        if (typeof fnOrObj === "function") {
            const newValue = unflattenObject(this._signal.value)
            const returnValue = fnOrObj(newValue)

            if (returnValue) return this._setSignalObject(returnValue)
            this._setSignalValue({ ...this._signal.value, ...flattenObject(newValue) })
            return true
        }

        return this._setSignalValue(fnOrObj)
    }
    // ---- x ------------------------

    valueOf() {
        return this._signal.value;
    }

    get value() {
        this._detectChange(this._signal)
        if (typeof this._signal.value === "object") return unflattenObject(this._signal.value)
        return this._signal.value
    }

    set value(v) {
        this._setSignalValue(v)
        this._runEffects(this)
    }
}

export const nanoSignal = (initVal) => {
    return new NanoSignal({
        value: initVal,
    })
}