import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'

// Mock canvas context
const mockFillRect = vi.fn()
const mockFillText = vi.fn()
const mockStrokeText = vi.fn()
const mockBeginPath = vi.fn()
const mockArc = vi.fn()
const mockFill = vi.fn()
const mockStroke = vi.fn()
const mockMoveTo = vi.fn()
const mockLineTo = vi.fn()

const mockContext = {
  fillRect: mockFillRect,
  fillText: mockFillText,
  strokeText: mockStrokeText,
  beginPath: mockBeginPath,
  arc: mockArc,
  fill: mockFill,
  stroke: mockStroke,
  moveTo: mockMoveTo,
  lineTo: mockLineTo,
  imageSmoothingEnabled: true,
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  textAlign: 'left',
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock getContext - use type assertion to bypass strict overload checking
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => mockContext),
})

// Mock requestAnimationFrame
const mockRequestAnimationFrame = vi.fn((cb: (time: number) => void) => {
  return window.setTimeout(() => cb(window.performance.now()), 16)
})
const mockCancelAnimationFrame = vi.fn()
window.requestAnimationFrame = mockRequestAnimationFrame
window.cancelAnimationFrame = mockCancelAnimationFrame

describe('Input Controls Module (US-011)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('renders canvas element', () => {
    const { getByTestId } = render(<App />)
    const canvas = getByTestId('game-canvas')
    expect(canvas).toBeTruthy()
  })

  it('has touch-action: none style to prevent page scroll', () => {
    const { getByTestId } = render(<App />)
    const canvas = getByTestId('game-canvas') as HTMLCanvasElement
    expect(canvas.style.touchAction).toBe('none')
  })

  it('has touch-none class for Tailwind touch handling', () => {
    const { getByTestId } = render(<App />)
    const canvas = getByTestId('game-canvas') as HTMLCanvasElement
    expect(canvas.classList.contains('touch-none')).toBe(true)
  })

  it('calls preventDefault on touchStart event', () => {
    const { getByTestId } = render(<App />)
    const canvas = getByTestId('game-canvas')
    
    const touchStartEvent = new TouchEvent('touchstart', { bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(touchStartEvent, 'preventDefault')
    
    fireEvent(canvas, touchStartEvent)
    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('calls preventDefault on touchMove event', () => {
    const { getByTestId } = render(<App />)
    const canvas = getByTestId('game-canvas')
    
    const touchMoveEvent = new TouchEvent('touchmove', { bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(touchMoveEvent, 'preventDefault')
    
    fireEvent(canvas, touchMoveEvent)
    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('calls preventDefault on touchEnd event', () => {
    const { getByTestId } = render(<App />)
    const canvas = getByTestId('game-canvas')
    
    const touchEndEvent = new TouchEvent('touchend', { bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(touchEndEvent, 'preventDefault')
    
    fireEvent(canvas, touchEndEvent)
    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('prevents default behavior on Space keydown', () => {
    render(<App />)
    
    const spaceEvent = new KeyboardEvent('keydown', { 
      code: 'Space', 
      bubbles: true, 
      cancelable: true 
    })
    const preventDefaultSpy = vi.spyOn(spaceEvent, 'preventDefault')
    
    window.dispatchEvent(spaceEvent)
    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('handles mouse click on canvas', () => {
    const { getByTestId } = render(<App />)
    const canvas = getByTestId('game-canvas')
    
    // Clicking canvas should not throw error
    expect(() => {
      fireEvent.click(canvas)
    }).not.toThrow()
  })

  it('canvas has cursor-pointer class for click indication', () => {
    const { getByTestId } = render(<App />)
    const canvas = getByTestId('game-canvas') as HTMLCanvasElement
    expect(canvas.classList.contains('cursor-pointer')).toBe(true)
  })

  it('starts game on mouse click when not started', async () => {
    const { getByTestId } = render(<App />)
    const canvas = getByTestId('game-canvas')
    
    fireEvent.click(canvas)
    
    // Game should start - animation frame requested
    await waitFor(() => {
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })
  })

  it('triggers jump on Space key press', async () => {
    render(<App />)
    
    // Start game first
    fireEvent.keyDown(window, { code: 'Space' })
    
    await waitFor(() => {
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })
  })

  it('registers keyboard event listener on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    render(<App />)
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('removes keyboard event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<App />)
    
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('handles touch events on mobile devices', () => {
    const { getByTestId } = render(<App />)
    const canvas = getByTestId('game-canvas')
    
    const touchEvent = new TouchEvent('touchstart', { bubbles: true })
    expect(() => {
      fireEvent(canvas, touchEvent)
    }).not.toThrow()
  })

  it('canvas has correct dimensions for game rendering', () => {
    const { getByTestId } = render(<App />)
    const canvas = getByTestId('game-canvas') as HTMLCanvasElement
    
    expect(canvas.width).toBe(400)
    expect(canvas.height).toBe(600)
  })
})
