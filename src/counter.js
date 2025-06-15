import { nanoSignal, effect, computed } from "./nano-signal/nanoSignal.prod"

export function setupCounter(element) {
  const counter = nanoSignal(0)
  const double = computed(() => counter.value * 2)

  const setCounter = (count) => {
    counter.value = count
  }
  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
  
  effect(() => {
    console.log("Updating Counter value...", counter.value)
    element.innerHTML = `count is ${counter.value} * 2 = ${double.value}`
  })
}