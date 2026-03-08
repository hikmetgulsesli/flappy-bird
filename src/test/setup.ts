import '@testing-library/jest-dom'

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

HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
  if (contextId === '2d') {
    return new MockCanvasContext() as unknown as CanvasRenderingContext2D
  }
  return null
})

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
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  return setTimeout(callback, 16) as unknown as number
})

global.cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id)
})
