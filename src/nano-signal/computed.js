
const computedMap = new Map()

const _runComputedEffects = (signal) => {
    for (let effect of computedMap.get(signal)) {
        signal.value = effect()
    console.log("run computed effects", computedMap.get(signal))
    }
}
// ---- x ------------------------

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
// ---- x ------------------------