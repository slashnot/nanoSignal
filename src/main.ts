import './style.css'
import { setupCounter } from './counter'

const counterElement = document.querySelector('#counter')
if (counterElement) {
  setupCounter(counterElement as HTMLElement)
}
