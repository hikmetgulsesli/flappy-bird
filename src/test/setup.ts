import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Inject design tokens CSS variables into document
document.documentElement.style.cssText = `
  --color-sky-cyan: #4EC0CA;
  --color-sky-gradient: #70c5ce;
  --color-sky-light: #a8e6cf;
  --color-bird-yellow: #F4D03F;
  --color-bird-dark: #d4ac0d;
  --color-bird-beak: #E67E22;
  --color-pipe-green: #73BF2E;
  --color-pipe-green-dark: #558B2F;
  --color-sand-ground: #DED895;
  --color-sand-dark: #d4c76a;
  --font-mono: "Courier New", "Lucida Console", Monaco, monospace;
  --pixel-size: 4px;
  --image-rendering: pixelated;
`

// Canvas mock for testing
class MockCanvasContext {
  fillStyle = ''
  strokeStyle = ''
  lineWidth = 1
  font = ''
  textAlign = 'left'
  imageSmoothingEnabled = true

  fillRect = vi.fn()
  strokeRect = vi.fn()
  clearRect = vi.fn()
  beginPath = vi.fn()
  closePath = vi.fn()
  arc = vi.fn()
  fill = vi.fn()
  stroke = vi.fn()
  moveTo = vi.fn()
  lineTo = vi.fn()
  fillText = vi.fn()
  strokeText = vi.fn()
}

const mockGetContext = vi.fn((contextId: string) => {
  if (contextId === '2d') {
    return new MockCanvasContext() as unknown as ReturnType<HTMLCanvasElement['getContext']>
  }
  return null
})

HTMLCanvasElement.prototype.getContext = mockGetContext as unknown as typeof HTMLCanvasElement.prototype.getContext

// localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// requestAnimationFrame mock
globalThis.requestAnimationFrame = vi.fn((callback: (time: number) => void) => {
  return setTimeout(() => callback(Date.now()), 16) as unknown as number
}) as unknown as typeof requestAnimationFrame

globalThis.cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id)
}) as unknown as typeof cancelAnimationFrame
