import { useEffect, useRef, useState, useCallback } from 'react'
import './index.css'

const GAME_WIDTH = 400
const GAME_HEIGHT = 600
const BIRD_SIZE = 30
const PIPE_WIDTH = 60
const PIPE_GAP = 150
const GRAVITY = 0.5
const JUMP_STRENGTH = -8
const PIPE_SPEED = 3

interface Pipe {
  x: number
  topHeight: number
  passed: boolean
}

interface GameState {
  birdY: number
  birdVelocity: number
  pipes: Pipe[]
  score: number
  highScore: number
  gameOver: boolean
  gameStarted: boolean
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
      score: 0,
      highScore: saved ? parseInt(saved, 10) : 0,
      gameOver: false,
      gameStarted: false,
    }
  })

  const resetGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      birdY: GAME_HEIGHT / 2,
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

    let frameCount = 0

    const gameLoop = () => {
      setState(prevState => {
        if (prevState.gameOver) return prevState

        const newState = { ...prevState }

        if (prevState.gameStarted) {
          // Apply gravity
          newState.birdVelocity += GRAVITY
          newState.birdY += newState.birdVelocity

          // Generate pipes
          frameCount++
          if (frameCount % 100 === 0) {
            const minHeight = 50
            const maxHeight = GAME_HEIGHT - PIPE_GAP - minHeight
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight) + minHeight)
            newState.pipes = [...newState.pipes, { x: GAME_WIDTH, topHeight, passed: false }]
          }

          // Move pipes
          newState.pipes = newState.pipes
            .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
            .filter(pipe => pipe.x + PIPE_WIDTH > 0)

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

          // Ground/ceiling collision
          if (newState.birdY < BIRD_SIZE / 2 || newState.birdY > GAME_HEIGHT - BIRD_SIZE / 2) {
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

    // Clear canvas
    ctx.fillStyle = '#87CEEB'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Draw pipes
    ctx.fillStyle = '#228B22'
    for (const pipe of state.pipes) {
      // Top pipe
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight)
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, GAME_HEIGHT - pipe.topHeight - PIPE_GAP)
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
    ctx.fillStyle = '#000'
    ctx.font = 'bold 24px monospace'
    ctx.fillText(state.score.toString(), 20, 40)

    // Draw game over screen
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 32px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50)
      ctx.font = '20px monospace'
      ctx.fillText(`Score: ${state.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2)
      ctx.fillText(`High Score: ${state.highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30)
      ctx.fillText('Click to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80)
      ctx.textAlign = 'left'
    }

    // Draw start screen
    if (!state.gameStarted && !state.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 28px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('FLAPPY BIRD', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30)
      ctx.font = '16px monospace'
      ctx.fillText('Click or Space to fly', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20)
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