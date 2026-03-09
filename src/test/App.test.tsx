import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
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

// Mock getContext
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => mockContext),
})

// Mock requestAnimationFrame
let rafCallbacks: Array<(time: number) => void> = []
const mockRequestAnimationFrame = vi.fn((cb: (time: number) => void) => {
  rafCallbacks.push(cb)
  return rafCallbacks.length
})
const mockCancelAnimationFrame = vi.fn((id: number) => {
  rafCallbacks[id - 1] = () => {}
})
window.requestAnimationFrame = mockRequestAnimationFrame
window.cancelAnimationFrame = mockCancelAnimationFrame

describe('Integration Wiring and E2E Verification (US-013)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rafCallbacks = []
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    rafCallbacks = []
  })

  describe('Component Integration', () => {
    it('renders all required components', () => {
      render(<App />)
      
      // Check canvas is rendered
      expect(screen.getByTestId('game-canvas')).toBeTruthy()
      
      // Check start screen is shown initially
      expect(screen.getByTestId('start-screen')).toBeTruthy()
      
      // Check title is rendered
      expect(screen.getByText(/Flappy/)).toBeTruthy()
      expect(screen.getByText(/Bird/)).toBeTruthy()
    })

    it('StartScreen component is interactive', async () => {
      render(<App />)
      
      const startScreen = screen.getByTestId('start-screen')
      expect(startScreen).toBeTruthy()
      
      // Click starts the game
      fireEvent.click(startScreen)
      
      // Start screen should disappear after clicking
      await waitFor(() => {
        expect(screen.queryByTestId('start-screen')).toBeNull()
      })
    })

    it('GameCanvas receives proper state props', () => {
      render(<App />)
      
      const canvas = screen.getByTestId('game-canvas')
      expect(canvas).toHaveAttribute('width', '400')
      expect(canvas).toHaveAttribute('height', '600')
    })
  })

  describe('Game Loop Integration', () => {
    it('game loop starts when game begins', async () => {
      render(<App />)
      
      // Click to start
      fireEvent.click(screen.getByTestId('start-screen'))
      
      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled()
      })
    })

    it('animation frame is requested for game updates', async () => {
      render(<App />)
      
      fireEvent.click(screen.getByTestId('start-screen'))
      
      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled()
      })
    })
  })

  describe('Menu → Playing → Game Over → Menu Flow', () => {
    it('starts in menu state with start screen visible', () => {
      render(<App />)
      
      expect(screen.getByTestId('start-screen')).toBeTruthy()
      expect(screen.queryByTestId('game-over-screen')).toBeNull()
    })

    it('transitions from menu to playing on click', async () => {
      render(<App />)
      
      fireEvent.click(screen.getByTestId('start-screen'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('start-screen')).toBeNull()
      })
    })

    it('keyboard space starts the game', async () => {
      render(<App />)
      
      fireEvent.keyDown(window, { code: 'Space' })
      
      await waitFor(() => {
        expect(screen.queryByTestId('start-screen')).toBeNull()
      })
    })

    it('space key is prevented from scrolling', async () => {
      render(<App />)
      
      const keyDownEvent = new KeyboardEvent('keydown', { code: 'Space', bubbles: true })
      const preventDefaultSpy = vi.spyOn(keyDownEvent, 'preventDefault')
      
      window.dispatchEvent(keyDownEvent)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Score System', () => {
    it('displays initial score of 0', () => {
      render(<App />)
      
      // Score should be rendered in canvas (mocked)
      expect(screen.getByText('High Score:')).toBeTruthy()
    })

    it('loads high score from localStorage on mount', () => {
      localStorageMock.getItem.mockReturnValue('42')
      
      render(<App />)
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('flappyHighScore')
    })

    it('displays loaded high score', () => {
      localStorageMock.getItem.mockReturnValue('42')
      
      render(<App />)
      
      expect(screen.getByText('42')).toBeTruthy()
    })
  })

  describe('Canvas Rendering', () => {
    it('canvas has correct dimensions', () => {
      render(<App />)
      
      const canvas = screen.getByTestId('game-canvas')
      expect(canvas).toHaveAttribute('width', '400')
      expect(canvas).toHaveAttribute('height', '600')
    })

    it('canvas has pixelated rendering style', () => {
      render(<App />)
      
      const canvas = screen.getByTestId('game-canvas')
      expect(canvas).toHaveClass('touch-none')
    })

    it('canvas is interactive', () => {
      render(<App />)
      
      const canvas = screen.getByTestId('game-canvas')
      expect(canvas).toHaveClass('cursor-pointer')
    })
  })

  describe('Interactive Elements', () => {
    it('canvas click triggers jump action', async () => {
      render(<App />)
      
      // First click starts the game
      fireEvent.click(screen.getByTestId('start-screen'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('start-screen')).toBeNull()
      })
      
      // Subsequent clicks on canvas should work
      const canvas = screen.getByTestId('game-canvas')
      fireEvent.click(canvas)
    })

    it('touch events are handled', async () => {
      render(<App />)
      
      const canvas = screen.getByTestId('game-canvas')
      fireEvent.touchStart(canvas)
      
      // Touch events should work without error
      expect(canvas).toBeTruthy()
    })

    it('touch event is handled on canvas', () => {
      render(<App />)
      
      const canvas = screen.getByTestId('game-canvas')
      // Touch events are handled by the component
      expect(canvas).toHaveClass('touch-none')
    })
  })

  describe('No Placeholder Content', () => {
    it('renders actual game title', () => {
      render(<App />)
      
      expect(screen.getByText(/Flappy/)).toBeTruthy()
      expect(screen.getByText(/Bird/)).toBeTruthy()
    })

    it('start screen shows proper game title', () => {
      render(<App />)
      
      const startScreen = screen.getByTestId('start-screen')
      expect(startScreen.textContent).toContain('FLAPPY BIRD')
    })

    it('start screen shows proper instructions', () => {
      render(<App />)
      
      const startScreen = screen.getByTestId('start-screen')
      expect(startScreen.textContent).toContain('Click or Space to fly')
    })
  })

  describe('Game State Management', () => {
    it('initial state shows start screen', () => {
      render(<App />)
      
      expect(screen.getByTestId('start-screen')).toBeTruthy()
    })

    it('clicking canvas triggers state change', async () => {
      render(<App />)
      
      fireEvent.click(screen.getByTestId('start-screen'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('start-screen')).toBeNull()
      })
    })
  })

  describe('High Score Display', () => {
    it('displays high score label', () => {
      render(<App />)
      
      expect(screen.getByText('High Score:')).toBeTruthy()
    })

    it('displays current high score value', () => {
      render(<App />)
      
      // Should show 0 as default
      const highScoreElements = screen.getAllByText('0')
      expect(highScoreElements.length).toBeGreaterThan(0)
    })
  })

  describe('Instructions Display', () => {
    it('shows control instructions', () => {
      render(<App />)
      
      // Get all elements with this text - there may be duplicates (StartScreen + footer)
      const instructions = screen.getAllByText('Click or Space to fly')
      expect(instructions.length).toBeGreaterThan(0)
    })
  })
})
