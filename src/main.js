import './style.css'
import { setupCounter } from './counter.js'
import { nanoSignal, effect, computed } from './nano-signal/nanoSignal.js'

window.nanoSignal = nanoSignal
window.effect = effect
window.computed = computed

setupCounter(document.querySelector('#counter'))
