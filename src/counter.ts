import { nanoSignal, effect, computed } from "./nano-signal/nanoSignal"

export function setupCounter(element: HTMLElement) {
  const counter = nanoSignal(0)
  const double = computed(() => counter.value * 2)

  const setCounter = (count: number) => {
    counter.value = count
  }
  element.addEventListener('click', () => setCounter(counter.value + 1))
  setCounter(0)
  
  effect(() => {
    console.log("Updating Counter value...", counter.value)
    const doubleValue = double ? double.value : 0
    element.innerHTML = `count is ${counter.value} * 2 = ${doubleValue}`
  })
}