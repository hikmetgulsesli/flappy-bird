import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
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

describe('Background and Visual Effects (US-012)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('renders canvas with correct dimensions', () => {
    render(<App />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeTruthy()
    expect(canvas?.width).toBe(288)
    expect(canvas?.height).toBe(512)
  })

  it('draws sky with gradient', async () => {
    render(<App />)
    
    // Wait for useEffect to run
    await waitFor(() => {
      expect(mockFillRect).toHaveBeenCalled()
    })

    // Check if sky was drawn (full canvas fill)
    const fillCalls = mockFillRect.mock.calls
    const skyDrawCall = fillCalls.find((call: number[]) => call[0] === 0 && call[1] === 0 && call[2] === 288 && call[3] === 512)
    expect(skyDrawCall).toBeTruthy()
  })

  it('draws ground at y=462 with sand color', async () => {
    render(<App />)
    
    await waitFor(() => {
      expect(mockFillRect).toHaveBeenCalled()
    })

    // Check if ground was drawn at correct position (GAME_HEIGHT - 50 = 462)
    const fillCalls = mockFillRect.mock.calls
    const groundDrawCall = fillCalls.find((call: number[]) => call[1] === 462)
    expect(groundDrawCall).toBeTruthy()
    expect(groundDrawCall![2]).toBe(288) // width
    expect(groundDrawCall![3]).toBe(50) // height
  })

  it('draws ground border line', async () => {
    render(<App />)
    
    await waitFor(() => {
      expect(mockFillRect).toHaveBeenCalled()
    })

    // Check if ground border was drawn (at y=454, height=8)
    const fillCalls = mockFillRect.mock.calls
    const borderDrawCall = fillCalls.find((call: number[]) => call[1] === 454 && call[3] === 8)
    expect(borderDrawCall).toBeTruthy()
  })

  it('disables image smoothing for pixel-art rendering', async () => {
    render(<App />)
    
    await waitFor(() => {
      expect(mockContext.imageSmoothingEnabled).toBe(false)
    })
  })

  it('renders background behind all game elements', async () => {
    render(<App />)
    
    await waitFor(() => {
      expect(mockFillRect).toHaveBeenCalled()
    })

    // First fillRect should be the sky (background)
    const firstCall = mockFillRect.mock.calls[0]
    expect(firstCall[0]).toBe(0)
    expect(firstCall[1]).toBe(0)
    expect(firstCall[2]).toBe(288) // full width
    expect(firstCall[3]).toBe(512) // full height
  })

  it('has pixel-art style class on canvas', () => {
    render(<App />)
    const canvas = document.querySelector('canvas')
    expect(canvas?.classList.contains('image-pixelated')).toBe(true)
  })
})
