import { useEffect, useRef, useState, useCallback } from 'react'
import './index.css'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PIPE_WIDTH,
  PIPE_GAP,
  generatePipe,
  updatePipes,
  shouldSpawnPipe,
  type Pipe,
} from './pipeSystem'

// Classic Flappy Bird dimensions (288x512)
const GROUND_HEIGHT = 112
const SKY_HEIGHT = GAME_HEIGHT - GROUND_HEIGHT // 400
const BIRD_SIZE = 20
const GRAVITY = 0.25
const JUMP_STRENGTH = -4.5

// Colors
const SKY_COLOR = '#4EC0CA'
const GROUND_COLOR = '#DED895'
const GRASS_COLOR = '#73BF2E'
const PIPE_COLOR = '#73BF2E'
const PIPE_CAP_COLOR = '#558B2F'

interface Cloud {
  x: number
  y: number
  size: number
  speed: number
}

interface GameState {
  birdY: number
  birdVelocity: number
  pipes: Pipe[]
  clouds: Cloud[]
  score: number
  highScore: number
  gameOver: boolean
  gameStarted: boolean
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const frameCountRef = useRef(0)
  
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('flappyHighScore')
    return {
      birdY: SKY_HEIGHT / 2,
      birdVelocity: 0,
      pipes: [],
      clouds: [
        { x: 50, y: 50, size: 30, speed: 0.3 },
        { x: 150, y: 80, size: 25, speed: 0.2 },
        { x: 220, y: 40, size: 35, speed: 0.25 },
      ],
      score: 0,
      highScore: saved ? parseInt(saved, 10) : 0,
      gameOver: false,
      gameStarted: false,
    }
  })

  const resetGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      birdY: SKY_HEIGHT / 2,
      birdVelocity: 0,
      pipes: [],
      score: 0,
      gameOver: false,
      gameStarted: true,
    }))
  }, [])

  const jump = useCallback(() => {
    if (state.gameOver) {
      resetGame()
      return
    }
    if (!state.gameStarted) {
      setState(prev => ({ ...prev, gameStarted: true }))
    }
    setState(prev => ({ ...prev, birdVelocity: JUMP_STRENGTH }))
  }, [state.gameOver, state.gameStarted, resetGame])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false

    const gameLoop = () => {
      setState(prevState => {
        if (prevState.gameOver) return prevState

        const newState = { ...prevState }

        if (prevState.gameStarted) {
          // Apply gravity
          newState.birdVelocity += GRAVITY
          newState.birdY += newState.birdVelocity

          // Generate pipes every 150 frames
          frameCountRef.current++
          if (shouldSpawnPipe(frameCountRef.current)) {
            newState.pipes = [...newState.pipes, generatePipe()]
          }

          // Move pipes and filter out off-screen pipes
          newState.pipes = updatePipes(newState.pipes)

          // Move clouds (parallax effect)
          newState.clouds = newState.clouds.map(cloud => {
            const newX = cloud.x - cloud.speed
            return {
              ...cloud,
              x: newX < -cloud.size * 2 ? GAME_WIDTH + cloud.size : newX,
            }
          })

          // Check collisions and score
          const birdLeft = GAME_WIDTH / 2 - BIRD_SIZE / 2
          const birdRight = birdLeft + BIRD_SIZE
          const birdTop = newState.birdY - BIRD_SIZE / 2
          const birdBottom = birdTop + BIRD_SIZE

          for (const pipe of newState.pipes) {
            // Score counting
            if (!pipe.passed && pipe.x + PIPE_WIDTH < birdLeft) {
              pipe.passed = true
              newState.score++
              if (newState.score > newState.highScore) {
                newState.highScore = newState.score
                localStorage.setItem('flappyHighScore', newState.highScore.toString())
              }
            }

            // Collision detection
            const pipeLeft = pipe.x
            const pipeRight = pipe.x + PIPE_WIDTH

            // Check horizontal overlap
            if (birdRight > pipeLeft && birdLeft < pipeRight) {
              // Check vertical collision with top pipe
              if (birdTop < pipe.topHeight) {
                newState.gameOver = true
              }
              // Check vertical collision with bottom pipe
              if (birdBottom > pipe.topHeight + PIPE_GAP) {
                newState.gameOver = true
              }
            }
          }

          // Ground collision (sky height is where ground starts)
          if (newState.birdY < BIRD_SIZE / 2 || newState.birdY > SKY_HEIGHT - BIRD_SIZE / 2) {
            newState.gameOver = true
          }
        }

        return newState
      })

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    animationRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false

    // 1. Draw sky background
    ctx.fillStyle = SKY_COLOR
    ctx.fillRect(0, 0, GAME_WIDTH, SKY_HEIGHT)

    // 2. Draw clouds (white circles at 30% opacity)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    for (const cloud of state.clouds) {
      // Main cloud body (multiple overlapping circles for fluffy look)
      ctx.beginPath()
      ctx.arc(cloud.x, cloud.y, cloud.size / 2, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(cloud.x + cloud.size * 0.3, cloud.y - cloud.size * 0.2, cloud.size * 0.4, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(cloud.x - cloud.size * 0.3, cloud.y - cloud.size * 0.1, cloud.size * 0.35, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(cloud.x + cloud.size * 0.1, cloud.y + cloud.size * 0.1, cloud.size * 0.3, 0, Math.PI * 2)
      ctx.fill()
    }

    // 3. Draw pipes (behind bird)
    ctx.fillStyle = PIPE_COLOR
    for (const pipe of state.pipes) {
      // Top pipe
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight)
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, SKY_HEIGHT - pipe.topHeight - PIPE_GAP)
      
      // Pipe caps (darker green #558B2F)
      ctx.fillStyle = PIPE_CAP_COLOR
      ctx.fillRect(pipe.x - 2, pipe.topHeight - 16, PIPE_WIDTH + 4, 16)
      ctx.fillRect(pipe.x - 2, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 4, 16)
      ctx.fillStyle = PIPE_COLOR
    }

    // 4. Draw bird
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(GAME_WIDTH / 2, state.birdY, BIRD_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()
    // Bird eye
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(GAME_WIDTH / 2 + 4, state.birdY - 4, 3, 0, Math.PI * 2)
    ctx.fill()
    // Bird beak
    ctx.fillStyle = '#FF8C00'
    ctx.beginPath()
    ctx.moveTo(GAME_WIDTH / 2 + 8, state.birdY)
    ctx.lineTo(GAME_WIDTH / 2 + 16, state.birdY + 2)
    ctx.lineTo(GAME_WIDTH / 2 + 8, state.birdY + 4)
    ctx.fill()

    // 5. Draw ground (at y=400)
    ctx.fillStyle = GROUND_COLOR
    ctx.fillRect(0, SKY_HEIGHT, GAME_WIDTH, GROUND_HEIGHT)
    
    // Grass detail line on ground
    ctx.fillStyle = GRASS_COLOR
    ctx.fillRect(0, SKY_HEIGHT, GAME_WIDTH, 12)
    
    // Grass details (small vertical lines for texture)
    ctx.fillStyle = '#6AB026'
    for (let i = 0; i < GAME_WIDTH; i += 16) {
      ctx.fillRect(i, SKY_HEIGHT + 12, 2, 4)
      ctx.fillRect(i + 8, SKY_HEIGHT + 12, 2, 3)
    }

    // Ground texture pattern
    ctx.fillStyle = '#D4CC86'
    for (let i = 0; i < GAME_WIDTH; i += 24) {
      for (let j = SKY_HEIGHT + 24; j < GAME_HEIGHT; j += 24) {
        ctx.fillRect(i, j, 2, 2)
      }
    }

    // 6. Draw score
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.font = 'bold 32px monospace'
    ctx.textAlign = 'center'
    ctx.strokeText(state.score.toString(), GAME_WIDTH / 2, 50)
    ctx.fillText(state.score.toString(), GAME_WIDTH / 2, 50)
    ctx.textAlign = 'left'

    // 7. Draw game over screen
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 3
      ctx.font = 'bold 24px monospace'
      ctx.textAlign = 'center'
      ctx.strokeText('GAME OVER', GAME_WIDTH / 2, SKY_HEIGHT / 2 - 40)
      ctx.fillText('GAME OVER', GAME_WIDTH / 2, SKY_HEIGHT / 2 - 40)
      ctx.font = '16px monospace'
      ctx.strokeText(`Score: ${state.score}`, GAME_WIDTH / 2, SKY_HEIGHT / 2)
      ctx.fillText(`Score: ${state.score}`, GAME_WIDTH / 2, SKY_HEIGHT / 2)
      ctx.strokeText(`High: ${state.highScore}`, GAME_WIDTH / 2, SKY_HEIGHT / 2 + 25)
      ctx.fillText(`High: ${state.highScore}`, GAME_WIDTH / 2, SKY_HEIGHT / 2 + 25)
      ctx.font = '12px monospace'
      ctx.strokeText('Click to restart', GAME_WIDTH / 2, SKY_HEIGHT / 2 + 60)
      ctx.fillText('Click to restart', GAME_WIDTH / 2, SKY_HEIGHT / 2 + 60)
      ctx.textAlign = 'left'
    }

    // 8. Draw start screen
    if (!state.gameStarted && !state.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 3
      ctx.font = 'bold 22px monospace'
      ctx.textAlign = 'center'
      ctx.strokeText('FLAPPY BIRD', GAME_WIDTH / 2, SKY_HEIGHT / 2 - 30)
      ctx.fillText('FLAPPY BIRD', GAME_WIDTH / 2, SKY_HEIGHT / 2 - 30)
      ctx.font = '12px monospace'
      ctx.strokeText('Click or Space', GAME_WIDTH / 2, SKY_HEIGHT / 2 + 20)
      ctx.fillText('Click or Space', GAME_WIDTH / 2, SKY_HEIGHT / 2 + 20)
      ctx.textAlign = 'left'
    }
  }, [state])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        jump()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [jump])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4 font-mono">Flappy Bird</h1>
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onClick={jump}
          onTouchStart={(e) => {
            e.preventDefault()
            jump()
          }}
          className="border-4 border-gray-700 rounded-lg cursor-pointer touch-none"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="mt-4 text-gray-400 text-sm">
          <p>High Score: <span className="text-yellow-400 font-bold">{state.highScore}</span></p>
          <p className="mt-2">Click or Space to fly</p>
        </div>
      </div>
    </div>
  )
}

export default App
