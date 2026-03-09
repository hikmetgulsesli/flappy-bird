import { useEffect, useRef, useState, useCallback } from 'react'
import './index.css'
import { MenuScreen, GameOverScreen } from './components'

const GAME_WIDTH = 400
const GAME_HEIGHT = 600
const GROUND_Y = 400
const GROUND_HEIGHT = GAME_HEIGHT - GROUND_Y
const BIRD_SIZE = 30
const PIPE_WIDTH = 60
const PIPE_GAP = 150
const GRAVITY = 0.5
const JUMP_STRENGTH = -8
const PIPE_SPEED = 3
const CLOUD_SPEED = 0.5

type GameStateType = 'menu' | 'playing' | 'gameOver'

interface Cloud {
  x: number
  y: number
  size: number
  opacity: number
}

interface Pipe {
  x: number
  topHeight: number
  passed: boolean
}

interface GameState {
  birdY: number
  birdVelocity: number
  pipes: Pipe[]
  clouds: Cloud[]
  score: number
  highScore: number
  gameState: GameStateType
}

function createCloud(x?: number): Cloud {
  return {
    x: x ?? Math.random() * GAME_WIDTH,
    y: 30 + Math.random() * 150,
    size: 30 + Math.random() * 40,
    opacity: 0.3,
  }
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('flappyHighScore')
    return {
      birdY: GAME_HEIGHT / 2,
      birdVelocity: 0,
      pipes: [],
      clouds: [createCloud(50), createCloud(150), createCloud(280)],
      score: 0,
      highScore: saved ? parseInt(saved, 10) : 0,
      gameState: 'menu',
    }
  })

  const startGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      gameState: 'playing',
    }))
  }, [])

  const resetGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      birdY: GAME_HEIGHT / 2,
      birdVelocity: 0,
      pipes: [],
      score: 0,
      gameState: 'playing',
    }))
  }, [])

  const jump = useCallback(() => {
    if (state.gameState === 'gameOver') {
      resetGame()
      return
    }
    if (state.gameState === 'menu') {
      startGame()
      return
    }
    setState(prev => ({ ...prev, birdVelocity: JUMP_STRENGTH }))
  }, [state.gameState, resetGame, startGame])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Disable smoothing for pixel art look
    ctx.imageSmoothingEnabled = false

    let frameCount = 0

    const gameLoop = () => {
      setState(prevState => {
        if (prevState.gameState === 'gameOver') return prevState

        const newState = { ...prevState }

        if (prevState.gameState === 'playing') {
          // Apply gravity
          newState.birdVelocity += GRAVITY
          newState.birdY += newState.birdVelocity

          // Generate pipes
          frameCount++
          if (frameCount % 100 === 0) {
            const minHeight = 50
            const maxHeight = GROUND_Y - PIPE_GAP - minHeight
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight) + minHeight)
            newState.pipes = [...newState.pipes, { x: GAME_WIDTH, topHeight, passed: false }]
          }

          // Move pipes
          newState.pipes = newState.pipes
            .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
            .filter(pipe => pipe.x + PIPE_WIDTH > 0)

          // Move clouds
          newState.clouds = newState.clouds
            .map(cloud => ({ ...cloud, x: cloud.x - CLOUD_SPEED }))
            .filter(cloud => cloud.x + cloud.size > 0)

          // Add new cloud occasionally
          if (frameCount % 300 === 0) {
            newState.clouds = [...newState.clouds, createCloud(GAME_WIDTH + 50)]
          }

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
                newState.gameState = 'gameOver'
              }
              // Check vertical collision with bottom pipe
              if (birdBottom > pipe.topHeight + PIPE_GAP) {
                newState.gameState = 'gameOver'
              }
            }
          }

          // Ground collision
          if (newState.birdY > GROUND_Y - BIRD_SIZE / 2) {
            newState.gameState = 'gameOver'
          }

          // Ceiling collision
          if (newState.birdY < BIRD_SIZE / 2) {
            newState.gameState = 'gameOver'
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

    // Disable smoothing for pixel art look
    ctx.imageSmoothingEnabled = false

    // Draw sky - cyan background #4EC0CA
    ctx.fillStyle = '#4EC0CA'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Draw clouds - white circles at 30% opacity
    for (const cloud of state.clouds) {
      ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`
      // Draw cloud as multiple overlapping circles for fluffy look
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

    // Draw ground - sand color #DED895 at y=400
    ctx.fillStyle = '#DED895'
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GROUND_HEIGHT)

    // Draw grass detail line on ground
    ctx.fillStyle = '#73BF2E'
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 12)
    // Grass texture - pixelated stripes
    ctx.fillStyle = '#558B2F'
    for (let i = 0; i < GAME_WIDTH; i += 20) {
      ctx.fillRect(i, GROUND_Y, 4, 12)
      ctx.fillRect(i + 10, GROUND_Y + 4, 4, 8)
    }
    // Ground top border line
    ctx.fillStyle = '#5a7d2a'
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 2)

    // Draw pipes
    ctx.fillStyle = '#228B22'
    for (const pipe of state.pipes) {
      // Top pipe
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight)
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, GROUND_Y - pipe.topHeight - PIPE_GAP)
      // Pipe caps
      ctx.fillStyle = '#1a6b1a'
      ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, PIPE_WIDTH + 4, 20)
      ctx.fillRect(pipe.x - 2, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 4, 20)
      ctx.fillStyle = '#228B22'
    }

    // Draw bird
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(GAME_WIDTH / 2, state.birdY, BIRD_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()
    // Bird eye
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(GAME_WIDTH / 2 + 5, state.birdY - 5, 4, 0, Math.PI * 2)
    ctx.fill()
    // Bird beak
    ctx.fillStyle = '#FF8C00'
    ctx.beginPath()
    ctx.moveTo(GAME_WIDTH / 2 + 10, state.birdY)
    ctx.lineTo(GAME_WIDTH / 2 + 20, state.birdY + 3)
    ctx.lineTo(GAME_WIDTH / 2 + 10, state.birdY + 6)
    ctx.fill()

    // Draw score
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 3
    ctx.font = 'bold 32px monospace'
    ctx.textAlign = 'center'
    ctx.strokeText(state.score.toString(), GAME_WIDTH / 2, 50)
    ctx.fillText(state.score.toString(), GAME_WIDTH / 2, 50)
    ctx.textAlign = 'left'
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
        <div className="relative inline-block">
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            onClick={jump}
            onTouchStart={(e) => {
              e.preventDefault()
              jump()
            }}
            className="border-4 border-gray-700 rounded-lg cursor-pointer touch-none image-pixelated"
            data-testid="game-canvas"
          />
          {state.gameState === 'menu' && (
            <MenuScreen highScore={state.highScore} onStart={startGame} />
          )}
          <GameOverScreen
            score={state.score}
            highScore={state.highScore}
            onRestart={resetGame}
            isVisible={state.gameState === 'gameOver'}
          />
        </div>
        <div className="mt-4 text-gray-400 text-sm">
          <p>
            High Score:{' '}
            <span className="text-yellow-400 font-bold">{state.highScore}</span>
          </p>
          <p className="mt-2">Click or Space to fly</p>
        </div>
      </div>
    </div>
  )
}

export default App
