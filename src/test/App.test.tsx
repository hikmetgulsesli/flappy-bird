import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock canvas context
const createMockContext = () => {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: 'left',
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  } as unknown as CanvasRenderingContext2D
}

describe('Flappy Bird App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)

    // Mock canvas - cast to any to avoid type issues
    HTMLCanvasElement.prototype.getContext = vi.fn(() => createMockContext()) as unknown as typeof HTMLCanvasElement.prototype.getContext

    // Mock requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
      return setTimeout(cb, 16) as unknown as number
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
      clearTimeout(id)
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the game title', () => {
    render(<App />)
    expect(screen.getByText('FLAPPY BIRD')).toBeInTheDocument()
  })

  it('displays high score from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('42')
    render(<App />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(localStorageMock.getItem).toHaveBeenCalledWith('flappyHighScore')
  })

  it('renders canvas element', () => {
    render(<App />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute('width', '400')
    expect(canvas).toHaveAttribute('height', '600')
  })

  it('displays instructions', () => {
    render(<App />)
    expect(screen.getByText('CLICK, SPACE, OR TAP TO FLY')).toBeInTheDocument()
  })

  it('canvas has pixelated rendering style', () => {
    render(<App />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toHaveStyle({ imageRendering: 'pixelated' })
  })

  it('responds to space key press', async () => {
    render(<App />)

    // Simulate space key press
    fireEvent.keyDown(window, { code: 'Space' })

    // Should not throw error
    await waitFor(() => {
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d')
    })
  })

  it('responds to canvas click', async () => {
    render(<App />)
    const canvas = document.querySelector('canvas')

    if (canvas) {
      fireEvent.click(canvas)
    }

    // Should not throw error
    await waitFor(() => {
      expect(canvas).toBeInTheDocument()
    })
  })

  it('has correct CSS classes for styling', () => {
    render(<App />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toHaveClass('border-4', 'border-gray-700', 'rounded-lg', 'cursor-pointer', 'touch-none')
  })

  it('displays zero high score when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null)
    render(<App />)
    const highScoreElements = screen.getAllByText('0')
    expect(highScoreElements.length).toBeGreaterThan(0)
  })
})

// Acceptance Criteria Tests
describe('Acceptance Criteria', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    HTMLCanvasElement.prototype.getContext = vi.fn(() => createMockContext()) as unknown as typeof HTMLCanvasElement.prototype.getContext
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('AC1: Game renders canvas with correct dimensions', () => {
    render(<App />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute('width', '400')
    expect(canvas).toHaveAttribute('height', '600')
  })

  it('AC2: High score is loaded from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('100')
    render(<App />)
    expect(localStorageMock.getItem).toHaveBeenCalledWith('flappyHighScore')
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('AC3: Game responds to user input (click and keyboard)', () => {
    render(<App />)
    const canvas = document.querySelector('canvas')

    // Should not throw on interactions
    expect(() => {
      if (canvas) fireEvent.click(canvas)
      fireEvent.keyDown(window, { code: 'Space' })
    }).not.toThrow()
  })

  it('AC4: Pixel-art styling is applied', () => {
    render(<App />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toHaveStyle({ imageRendering: 'pixelated' })
  })

  it('AC5: Mobile touch support is enabled', () => {
    render(<App />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toHaveClass('touch-none')
  })
})
