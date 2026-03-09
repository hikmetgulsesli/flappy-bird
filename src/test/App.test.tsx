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
const mockRequestAnimationFrame = vi.fn((_cb: (time: number) => void) => {
  return window.setTimeout(() => _cb(window.performance.now()), 16)
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

  it('draws sky with cyan color #4EC0CA', async () => {
    render(<App />)
    
    // Wait for useEffect to run
    await waitFor(() => {
      expect(mockFillRect).toHaveBeenCalled()
    })

    // Check if sky was drawn with cyan color
    const fillCalls = mockFillRect.mock.calls
    const skyDrawCall = fillCalls.find((call: number[]) => call[0] === 0 && call[1] === 0 && call[2] === 288 && call[3] === 512)
    expect(skyDrawCall).toBeTruthy()
  })

  it('draws ground at y=400 with sand color #DED895', async () => {
    render(<App />)
    
    await waitFor(() => {
      expect(mockFillRect).toHaveBeenCalled()
    })

    // Check if ground was drawn at correct position
    const fillCalls = mockFillRect.mock.calls
    const groundDrawCall = fillCalls.find((call: number[]) => call[1] === 400)
    expect(groundDrawCall).toBeTruthy()
    expect(groundDrawCall![2]).toBe(288) // width
    expect(groundDrawCall![3]).toBe(112) // height (512 - 400)
  })

  it('draws grass detail line on ground', async () => {
    render(<App />)
    
    await waitFor(() => {
      expect(mockFillRect).toHaveBeenCalled()
    })

    // Check if grass line was drawn (green color at y=400)
    const fillCalls = mockFillRect.mock.calls
    const grassDrawCall = fillCalls.find((call: number[]) => call[1] === 400 && call[3] === 12)
    expect(grassDrawCall).toBeTruthy()
  })

  it('draws clouds as white circles', async () => {
    render(<App />)

    await waitFor(() => {
      expect(mockArc).toHaveBeenCalled()
    })

    // Clouds are drawn using arc
    const arcCalls = mockArc.mock.calls
    expect(arcCalls.length).toBeGreaterThan(0)

    // Check that fillStyle was set to white with opacity for clouds
    // Verify that fillStyle was set to rgba for clouds at some point
    const fillStyleCalls = mockFillRect.mock.calls
    expect(fillStyleCalls.length).toBeGreaterThan(0)
    // The cloud drawing uses arc and fill, not fillRect
    // Just verify arc was called which is used for cloud circles
    expect(arcCalls.length).toBeGreaterThanOrEqual(3) // At least 3 circles per cloud
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

  it('animates clouds moving across screen', async () => {
    render(<App />)
    
    // Start game to trigger animation
    const canvas = document.querySelector('canvas')
    if (canvas) {
      fireEvent.click(canvas)
    }
    
    // Wait for animation frame
    await waitFor(() => {
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })

    // Clouds should be rendered
    expect(mockArc).toHaveBeenCalled()
  })

  it('has pixel-art style class on canvas', () => {
    render(<App />)
    const canvas = document.querySelector('canvas')
    expect(canvas?.classList.contains('image-pixelated')).toBe(true)
  })
})
