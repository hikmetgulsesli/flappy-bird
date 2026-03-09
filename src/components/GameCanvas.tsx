import React, { useEffect, useRef, useCallback } from 'react'
import type { GameState, Cloud } from '../hooks/useGameState'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GROUND_Y,
  BIRD_SIZE,
  PIPE_WIDTH,
} from '../collisionSystem'

interface GameCanvasProps {
  state: GameState
  onJump: () => void
}

const PIPE_GAP = 150

function drawCloud(ctx: CanvasRenderingContext2D, cloud: Cloud): void {
  ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`
  const circles = [
    { dx: 0, dy: 0, r: cloud.size * 0.6 },
    { dx: cloud.size * 0.4, dy: -cloud.size * 0.1, r: cloud.size * 0.5 },
    { dx: -cloud.size * 0.3, dy: cloud.size * 0.1, r: cloud.size * 0.4 },
  ]
  for (const circle of circles) {
    ctx.beginPath()
    ctx.arc(cloud.x + circle.dx, cloud.y + circle.dy, circle.r, 0, Math.PI * 2)
    ctx.fill()
  }
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ state, onJump }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Disable smoothing for pixel art look
    ctx.imageSmoothingEnabled = false

    // Draw sky - cyan background
    ctx.fillStyle = 'var(--color-sky-cyan)'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Draw clouds
    for (const cloud of state.clouds) {
      drawCloud(ctx, cloud)
    }

    // Draw ground
    const groundHeight = GAME_HEIGHT - GROUND_Y
    ctx.fillStyle = 'var(--color-sand-ground)'
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, groundHeight)

    // Draw grass detail line on ground
    ctx.fillStyle = 'var(--color-pipe-green)'
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 12)
    // Grass texture - pixelated stripes
    ctx.fillStyle = 'var(--color-pipe-green-dark)'
    for (let i = 0; i < GAME_WIDTH; i += 20) {
      ctx.fillRect(i, GROUND_Y, 4, 12)
      ctx.fillRect(i + 10, GROUND_Y + 4, 4, 8)
    }
    // Ground top border line
    ctx.fillStyle = 'var(--color-ground-border)'
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 2)

    // Draw pipes
    ctx.fillStyle = 'var(--color-pipe-green)'
    for (const pipe of state.pipes) {
      // Top pipe
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight)
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, GROUND_Y - pipe.topHeight - PIPE_GAP)
      // Pipe caps
      ctx.fillStyle = 'var(--color-pipe-green-dark)'
      ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, PIPE_WIDTH + 4, 20)
      ctx.fillRect(pipe.x - 2, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 4, 20)
      ctx.fillStyle = 'var(--color-pipe-green)'
    }

    // Draw bird
    const birdX = state.bird.x
    const birdY = state.bird.y
    
    ctx.fillStyle = 'var(--color-bird-yellow)'
    ctx.beginPath()
    ctx.arc(birdX, birdY, BIRD_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()
    
    // Bird eye
    ctx.fillStyle = 'var(--color-bird-pupil)'
    ctx.beginPath()
    ctx.arc(birdX + 5, birdY - 5, 4, 0, Math.PI * 2)
    ctx.fill()
    
    // Bird beak
    ctx.fillStyle = 'var(--color-bird-beak)'
    ctx.beginPath()
    ctx.moveTo(birdX + 10, birdY)
    ctx.lineTo(birdX + 20, birdY + 3)
    ctx.lineTo(birdX + 10, birdY + 6)
    ctx.fill()

    // Draw score
    ctx.fillStyle = 'var(--color-text-primary)'
    ctx.strokeStyle = 'var(--color-text-dark)'
    ctx.lineWidth = 3
    ctx.font = 'bold 32px var(--font-mono)'
    ctx.textAlign = 'center'
    ctx.strokeText(state.score.toString(), GAME_WIDTH / 2, 50)
    ctx.fillText(state.score.toString(), GAME_WIDTH / 2, 50)
    ctx.textAlign = 'left'
  }, [state])

  // Handle touch
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    onJump()
  }, [onJump])

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      onClick={onJump}
      onTouchStart={handleTouchStart}
      className="border-4 border-gray-700 rounded-lg cursor-pointer touch-none"
      style={{ imageRendering: 'pixelated' }}
      data-testid="game-canvas"
    />
  )
}

export default GameCanvas
