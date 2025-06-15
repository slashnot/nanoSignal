import './style.css'
import { setupCounter } from './counter.js'
import { nanoSignal, effect } from './nano-signal/nanoSignal.js'

window.nanoSignal = nanoSignal
window.effect = effect

setupCounter(document.querySelector('#counter'))
