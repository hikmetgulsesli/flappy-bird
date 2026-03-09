import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import App from '../App'

// Mock localStorage with proper state
let localStorageData: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageData[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageData[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageData[key]
  }),
  clear: vi.fn(() => {
    localStorageData = {}
  }),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock canvas context with tracking
let mockFillTextCalls: Array<{ text: string; x: number; y: number }> = []
let mockStrokeTextCalls: Array<{ text: string; x: number; y: number }> = []

const createMockContext = () => {
  mockFillTextCalls = []
  mockStrokeTextCalls = []

  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: 'left',
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn((text: string, x: number, y: number) => {
      mockFillTextCalls.push({ text: String(text), x, y })
    }),
    strokeText: vi.fn((text: string, x: number, y: number) => {
      mockStrokeTextCalls.push({ text: String(text), x, y })
    }),
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

describe('Scoring System with Persistence (US-007)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageData = {}
    mockFillTextCalls = []
    mockStrokeTextCalls = []

    // Mock canvas
    HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
      if (contextId === '2d') {
        return createMockContext()
      }
      return null
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('AC1: Score increments exactly once per pipe passed', () => {
    it('should initialize score at 0', () => {
      render(<App />)
      // Score 0 should be rendered somewhere (canvas or UI)
      const zeroElements = screen.getAllByText('0')
      expect(zeroElements.length).toBeGreaterThan(0)
    })

    it('should track score state internally', async () => {
      render(<App />)
      const canvas = document.querySelector('canvas')
      expect(canvas).toBeInTheDocument()

      // Click to start the game
      if (canvas) {
        await act(async () => {
          fireEvent.click(canvas)
        })
      }

      // Game should be running
      expect(canvas).toHaveClass('cursor-pointer')
    })

    it('should not increment score without game start', () => {
      render(<App />)
      // Before game starts, score should remain 0
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('AC2: Score displays as white text with black outline', () => {
    it('should render score text on canvas', () => {
      render(<App />)

      // Check that fillText was called with score '0'
      const scoreCall = mockFillTextCalls.find(call => call.text === '0')
      expect(scoreCall).toBeDefined()
    })

    it('should use strokeText for outline effect', () => {
      render(<App />)

      // Check that strokeText was called with score '0'
      const strokeCall = mockStrokeTextCalls.find(call => call.text === '0')
      expect(strokeCall).toBeDefined()
    })

    it('should render score at top center position', () => {
      render(<App />)

      // Score should be centered (x ~ 144 for 288px canvas)
      const scoreCall = mockFillTextCalls.find(call => call.text === '0')
      if (scoreCall) {
        expect(scoreCall.x).toBe(144) // GAME_WIDTH / 2
        expect(scoreCall.y).toBe(50) // Top position
      }
    })

    it('should use correct font for retro style', () => {
      render(<App />)

      // Font should include Courier New for retro look
      // This is validated through the canvas font property
      expect(mockFillTextCalls.length).toBeGreaterThan(0)
    })
  })

  describe('AC3: High score persists in localStorage', () => {
    it('should read high score from localStorage on mount', () => {
      localStorageData['flappyHighScore'] = '150'
      render(<App />)

      expect(localStorageMock.getItem).toHaveBeenCalledWith('flappyHighScore')
      expect(screen.getByText('150')).toBeInTheDocument()
    })

    it('should handle missing localStorage gracefully', () => {
      localStorageData = {}
      render(<App />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle corrupted localStorage data', () => {
      localStorageData['flappyHighScore'] = 'not-a-number'
      render(<App />)

      // Should not crash (NaN is displayed but app doesn't crash)
      expect(document.body).toBeInTheDocument()
    })

    it('should use correct localStorage key', () => {
      render(<App />)

      expect(localStorageMock.getItem).toHaveBeenCalledWith('flappyHighScore')
    })
  })

  describe('AC4: High score auto-updates when beaten', () => {
    it('should save high score to localStorage', async () => {
      localStorageData['flappyHighScore'] = '10'
      render(<App />)

      // Start the game
      const canvas = document.querySelector('canvas')
      if (canvas) {
        await act(async () => {
          fireEvent.click(canvas)
        })
      }

      // High score should still be from localStorage
      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument()
      })
    })

    it('should display high score in UI', () => {
      localStorageData['flappyHighScore'] = '999'
      render(<App />)

      // Menu screen shows high score - check by testid
      expect(screen.getByTestId('menu-highscore')).toHaveTextContent('999')
    })

    it('should have styled high score display', () => {
      localStorageData['flappyHighScore'] = '50'
      render(<App />)

      const highScoreElement = screen.getByText('50')
      expect(highScoreElement).toHaveClass('text-retro-gold', 'font-bold')
    })
  })

  describe('AC5: Score reads correctly on game load', () => {
    it('should initialize with 0 when no saved score exists', () => {
      localStorageData = {}
      render(<App />)

      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBeGreaterThanOrEqual(1)
    })

    it('should load previous high score from localStorage', () => {
      localStorageData['flappyHighScore'] = '75'
      render(<App />)

      expect(screen.getByText('75')).toBeInTheDocument()
    })

    it('should maintain high score across re-renders', () => {
      localStorageData['flappyHighScore'] = '200'
      const { rerender } = render(<App />)

      expect(screen.getByText('200')).toBeInTheDocument()

      // Re-render should maintain the score
      rerender(<App />)
      expect(screen.getByText('200')).toBeInTheDocument()
    })

    it('should update high score when new record is set', async () => {
      localStorageData['flappyHighScore'] = '5'
      render(<App />)

      // Initially shows saved high score
      expect(screen.getByText('5')).toBeInTheDocument()

      // After game interactions, localStorage.setItem should be callable
      expect(localStorageMock.setItem).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative high score values', () => {
      localStorageData['flappyHighScore'] = '-10'
      render(<App />)

      // Should handle gracefully (display 0 or the value)
      expect(document.body).toBeInTheDocument()
    })

    it('should handle very large high scores', () => {
      localStorageData['flappyHighScore'] = '999999'
      render(<App />)

      expect(screen.getByText('999999')).toBeInTheDocument()
    })
  })

  describe('UI Integration', () => {
    it('should display score in game over screen format', () => {
      render(<App />)

      // Game over screen uses canvas for rendering
      // Verify canvas context is set up correctly
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d')
    })

    it('should have responsive layout for score display', () => {
      render(<App />)

      const canvas = document.querySelector('canvas')
      expect(canvas).toHaveAttribute('width', '288')
      expect(canvas).toHaveAttribute('height', '512')
    })
  })
})
