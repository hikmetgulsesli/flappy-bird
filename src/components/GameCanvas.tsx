import { useEffect, useRef, useCallback } from 'react'

export interface GameCanvasProps {
  /** Canvas width in pixels (default: 288) */
  width?: number
  /** Canvas height in pixels (default: 512) */
  height?: number
  /** Game update callback - called before each render */
  onUpdate?: (deltaTime: number) => void
  /** Game render callback - use this to draw on canvas */
  onRender?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
  /** Click/tap handler */
  onAction?: () => void
  /** CSS class names */
  className?: string
  /** Whether the game loop is active */
  isRunning?: boolean
}

/**
 * GameCanvas - Core Canvas-based game engine component
 * 
 * Features:
 * - Fixed 288x512px game resolution (configurable)
 * - 60fps requestAnimationFrame game loop
 * - 2D rendering context with pixelated rendering
 * - Automatic cleanup on unmount
 * - TypeScript type safety throughout
 */
export function GameCanvas({
  width = 288,
  height = 512,
  onUpdate,
  onRender,
  onAction,
  className = '',
  isRunning = true,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const isRunningRef = useRef(isRunning)

  // Keep ref in sync with prop
  useEffect(() => {
    isRunningRef.current = isRunning
  }, [isRunning])

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Disable smoothing for pixel art look
    ctx.imageSmoothingEnabled = false

    const gameLoop = (timestamp: number) => {
      // Calculate delta time in milliseconds
      const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : 16.67
      lastTimeRef.current = timestamp

      // Call update callback if provided and game is running
      if (isRunningRef.current && onUpdate) {
        onUpdate(deltaTime)
      }

      // Call render callback if provided
      if (onRender) {
        onRender(ctx, width, height)
      }

      // Schedule next frame
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    // Start the game loop
    animationRef.current = requestAnimationFrame(gameLoop)

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [onUpdate, onRender, width, height])

  // Handle canvas interaction
  const handleClick = useCallback(() => {
    onAction?.()
  }, [onAction])

  const handleTouchStart = useCallback((e: import('react').TouchEvent) => {
    e.preventDefault()
    onAction?.()
  }, [onAction])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      className={`cursor-pointer touch-none image-pixelated ${className}`}
      data-testid="game-canvas"
      aria-label="Game canvas"
    />
  )
}

export default GameCanvas
