import '@testing-library/jest-dom'
import { vi } from 'vitest'

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
