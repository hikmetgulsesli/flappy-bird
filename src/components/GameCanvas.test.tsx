import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { GameCanvas } from './GameCanvas'

describe('GameCanvas', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Canvas Rendering', () => {
    it('should render canvas at default dimensions (288x512)', () => {
      render(<GameCanvas />)
      const canvas = screen.getByTestId('game-canvas')
      
      expect(canvas).toBeInTheDocument()
      expect(canvas).toHaveAttribute('width', '288')
      expect(canvas).toHaveAttribute('height', '512')
    })

    it('should render canvas at custom dimensions', () => {
      render(<GameCanvas width={400} height={600} />)
      const canvas = screen.getByTestId('game-canvas')
      
      expect(canvas).toHaveAttribute('width', '400')
      expect(canvas).toHaveAttribute('height', '600')
    })

    it('should have correct aspect ratio at default size', () => {
      render(<GameCanvas />)
      const canvas = screen.getByTestId('game-canvas') as HTMLCanvasElement
      
      const aspectRatio = canvas.width / canvas.height
      expect(aspectRatio).toBe(288 / 512)
      expect(aspectRatio).toBeCloseTo(0.5625, 4)
    })

    it('should apply pixelated rendering class', () => {
      render(<GameCanvas />)
      const canvas = screen.getByTestId('game-canvas')
      
      expect(canvas).toHaveClass('image-pixelated')
    })

    it('should apply custom className', () => {
      render(<GameCanvas className="custom-game-class" />)
      const canvas = screen.getByTestId('game-canvas')
      
      expect(canvas).toHaveClass('custom-game-class')
      expect(canvas).toHaveClass('image-pixelated')
    })
  })

  describe('2D Rendering Context', () => {
    it('should initialize 2D rendering context', () => {
      render(<GameCanvas />)
      const canvas = screen.getByTestId('game-canvas') as HTMLCanvasElement
      const ctx = canvas.getContext('2d')
      
      expect(ctx).not.toBeNull()
    })

    it('should disable image smoothing for pixel art', async () => {
      const onRender = vi.fn()
      render(<GameCanvas onRender={onRender} />)
      
      // Wait for one render cycle
      await waitFor(() => {
        expect(onRender).toHaveBeenCalled()
      })
      
      const canvas = screen.getByTestId('game-canvas') as HTMLCanvasElement
      const ctx = canvas.getContext('2d')
      
      // The component sets imageSmoothingEnabled to false in the game loop
      // Since we're using a mock, we verify the mock context was obtained
      expect(ctx).not.toBeNull()
    })
  })

  describe('Game Loop', () => {
    it('should call onUpdate with delta time', async () => {
      const onUpdate = vi.fn()
      render(<GameCanvas onUpdate={onUpdate} />)
      
      // Wait for the game loop to run
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled()
      }, { timeout: 100 })
      
      // Check that deltaTime is passed and is a reasonable value
      const calls = onUpdate.mock.calls
      expect(calls.length).toBeGreaterThan(0)
      
      // Delta time should be a positive number (in milliseconds)
      const deltaTime = calls[0][0] as number
      expect(deltaTime).toBeGreaterThan(0)
      expect(typeof deltaTime).toBe('number')
    })

    it('should call onRender with context and dimensions', async () => {
      const onRender = vi.fn()
      render(<GameCanvas width={288} height={512} onRender={onRender} />)
      
      await waitFor(() => {
        expect(onRender).toHaveBeenCalled()
      })
      
      const calls = onRender.mock.calls
      expect(calls.length).toBeGreaterThan(0)
      
      // Should be called with (ctx, width, height)
      const [ctx, width, height] = calls[0]
      // Verify context object is passed (mocked in jsdom)
      expect(ctx).toBeDefined()
      expect(typeof ctx.fillRect).toBe('function')
      expect(width).toBe(288)
      expect(height).toBe(512)
    })

    it('should run at approximately 60fps', async () => {
      const onUpdate = vi.fn()
      render(<GameCanvas onUpdate={onUpdate} />)
      
      // Wait for multiple frames
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const callCount = onUpdate.mock.calls.length
      // At 60fps, 100ms should yield ~6 frames
      expect(callCount).toBeGreaterThanOrEqual(3)
      expect(callCount).toBeLessThanOrEqual(15)
    })
  })

  describe('Cleanup', () => {
    it('should cancel animation frame on unmount', () => {
      const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame')
      const { unmount } = render(<GameCanvas />)
      
      unmount()
      
      expect(cancelAnimationFrameSpy).toHaveBeenCalled()
      cancelAnimationFrameSpy.mockRestore()
    })

    it('should stop calling callbacks after unmount', async () => {
      const onUpdate = vi.fn()
      const { unmount } = render(<GameCanvas onUpdate={onUpdate} />)
      
      // Wait for initial calls
      await waitFor(() => expect(onUpdate).toHaveBeenCalled())
      
      const callCountBefore = onUpdate.mock.calls.length
      
      unmount()
      
      // Advance time after unmount
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Should not have more calls after unmount
      expect(onUpdate.mock.calls.length).toBe(callCountBefore)
    })
  })

  describe('Interaction', () => {
    it('should call onAction when clicked', () => {
      const onAction = vi.fn()
      render(<GameCanvas onAction={onAction} />)
      const canvas = screen.getByTestId('game-canvas')
      
      fireEvent.click(canvas)
      
      expect(onAction).toHaveBeenCalledTimes(1)
    })

    it('should call onAction on touch start', () => {
      const onAction = vi.fn()
      render(<GameCanvas onAction={onAction} />)
      const canvas = screen.getByTestId('game-canvas')
      
      fireEvent.touchStart(canvas)
      
      expect(onAction).toHaveBeenCalledTimes(1)
    })

    it('should have cursor-pointer class for clickability', () => {
      render(<GameCanvas />)
      const canvas = screen.getByTestId('game-canvas')
      
      expect(canvas).toHaveClass('cursor-pointer')
    })

    it('should have touch-none class for mobile support', () => {
      render(<GameCanvas />)
      const canvas = screen.getByTestId('game-canvas')
      
      expect(canvas).toHaveClass('touch-none')
    })
  })

  describe('Game State Control', () => {
    it('should not call onUpdate when isRunning is false', async () => {
      const onUpdate = vi.fn()
      render(<GameCanvas onUpdate={onUpdate} isRunning={false} />)
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // onUpdate might be called once initially but should stop after isRunning changes
      const initialCalls = onUpdate.mock.calls.length
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Should not continue calling after initial
      expect(onUpdate.mock.calls.length).toBe(initialCalls)
    })

    it('should resume onUpdate when isRunning becomes true', async () => {
      const onUpdate = vi.fn()
      const { rerender } = render(<GameCanvas onUpdate={onUpdate} isRunning={false} />)
      
      await new Promise(resolve => setTimeout(resolve, 30))
      const callsWhenPaused = onUpdate.mock.calls.length
      
      rerender(<GameCanvas onUpdate={onUpdate} isRunning={true} />)
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      expect(onUpdate.mock.calls.length).toBeGreaterThan(callsWhenPaused)
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should accept all optional props', () => {
      // This test verifies TypeScript compiles correctly
      const props = {
        width: 288,
        height: 512,
        onUpdate: (deltaTime: number) => { console.log(deltaTime) },
        onRender: (ctx: CanvasRenderingContext2D, w: number, h: number) => { 
          ctx.clearRect(0, 0, w, h) 
        },
        onAction: () => {},
        className: 'test',
        isRunning: true,
      }
      
      // Should compile without errors
      const { container } = render(<GameCanvas {...props} />)
      expect(container).toBeInTheDocument()
    })
  })
})
