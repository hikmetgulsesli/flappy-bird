import { useEffect, useRef, useState, useCallback } from 'react'
import './index.css'

const GAME_WIDTH = 400
const GAME_HEIGHT = 600
const BIRD_SIZE = 24
const PIPE_WIDTH = 52
const PIPE_GAP = 140
const GRAVITY = 0.4
const JUMP_STRENGTH = -7
const PIPE_SPEED = 2.5
const DEATH_ANIMATION_DURATION = 800

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
}

interface Pipe {
  x: number
  topHeight: number
  passed: boolean
}

interface GameState {
  birdY: number
  birdVelocity: number
  birdRotation: number
  pipes: Pipe[]
  score: number
  highScore: number
  gameOver: boolean
  gameStarted: boolean
  deathTime: number | null
  particles: Particle[]
}

// Pixel-art colors
const COLORS = {
  sky: '#70c5ce',
  skyGradient: '#a8e6cf',
  bird: '#f4d03f',
  birdDark: '#d4ac0d',
  birdEye: '#fff',
  birdPupil: '#000',
  birdBeak: '#e67e22',
  pipe: '#73bf2e',
  pipeLight: '#a0de6e',
  pipeDark: '#5a9a1e',
  pipeBorder: '#2d5016',
  ground: '#ded895',
  groundDark: '#d4c76a',
}

function createExplosion(x: number, y: number): Particle[] {
  const particles: Particle[] = []
  const colors = [COLORS.bird, COLORS.birdDark, COLORS.birdBeak, '#ff6b6b']
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12
    const speed = 2 + Math.random() * 3
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: DEATH_ANIMATION_DURATION,
      maxLife: DEATH_ANIMATION_DURATION,
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  }
  return particles
}

function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  pixelSize: number = 4
) {
  ctx.fillStyle = color
  // Draw with pixelated edges
  const pixelatedX = Math.floor(x / pixelSize) * pixelSize
  const pixelatedY = Math.floor(y / pixelSize) * pixelSize
  const pixelatedW = Math.ceil(width / pixelSize) * pixelSize
  const pixelatedH = Math.ceil(height / pixelSize) * pixelSize
  ctx.fillRect(pixelatedX, pixelatedY, pixelatedW, pixelatedH)
}

function drawPixelCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  pixelSize: number = 4
) {
  ctx.fillStyle = color
  const pixelatedRadius = Math.ceil(radius / pixelSize) * pixelSize
  ctx.beginPath()
  ctx.arc(
    Math.floor(x / pixelSize) * pixelSize + pixelSize / 2,
    Math.floor(y / pixelSize) * pixelSize + pixelSize / 2,
    pixelatedRadius,
    0,
    Math.PI * 2
  )
  ctx.fill()
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('flappyHighScore')
    return {
      birdY: GAME_HEIGHT / 2,
      birdVelocity: 0,
      birdRotation: 0,
      pipes: [],
      score: 0,
      highScore: saved ? parseInt(saved, 10) : 0,
      gameOver: false,
      gameStarted: false,
      deathTime: null,
      particles: [],
    }
  })

  const resetGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      birdY: GAME_HEIGHT / 2,
      birdVelocity: 0,
      birdRotation: 0,
      pipes: [],
      score: 0,
      gameOver: false,
      gameStarted: true,
      deathTime: null,
      particles: [],
    }))
    lastTimeRef.current = 0
  }, [])

  const jump = useCallback(() => {
    if (state.gameOver) {
      // Wait for death animation to complete
      if (state.deathTime && Date.now() - state.deathTime < DEATH_ANIMATION_DURATION) {
        return
      }
      resetGame()
      return
    }
    if (!state.gameStarted) {
      setState(prev => ({ ...prev, gameStarted: true }))
    }
    setState(prev => ({ ...prev, birdVelocity: JUMP_STRENGTH }))
  }, [state.gameOver, state.gameStarted, state.deathTime, resetGame])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frameCount = 0

    const gameLoop = (timestamp: number) => {
      const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : 16
      lastTimeRef.current = timestamp

      setState(prevState => {
        if (prevState.gameOver && prevState.particles.length === 0) {
          // Just update particles if game over and no animation
          return prevState
        }

        const newState = { ...prevState }

        // Update particles
        if (newState.particles.length > 0) {
          newState.particles = newState.particles
            .map(p => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              vy: p.vy + 0.1,
              life: p.life - deltaTime,
            }))
            .filter(p => p.life > 0)
        }

        if (!prevState.gameOver && prevState.gameStarted) {
          // Apply gravity
          newState.birdVelocity += GRAVITY
          newState.birdY += newState.birdVelocity

          // Update bird rotation based on velocity
          newState.birdRotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (newState.birdVelocity * Math.PI) / 20))

          // Generate pipes
          frameCount++
          if (frameCount % 120 === 0) {
            const minHeight = 60
            const maxHeight = GAME_HEIGHT - PIPE_GAP - minHeight - 100
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
                newState.deathTime = Date.now()
                newState.particles = createExplosion(GAME_WIDTH / 2, newState.birdY)
              }
              // Check vertical collision with bottom pipe
              if (birdBottom > pipe.topHeight + PIPE_GAP) {
                newState.gameOver = true
                newState.deathTime = Date.now()
                newState.particles = createExplosion(GAME_WIDTH / 2, newState.birdY)
              }
            }
          }

          // Ground/ceiling collision
          if (newState.birdY < BIRD_SIZE / 2 || newState.birdY > GAME_HEIGHT - BIRD_SIZE / 2 - 50) {
            newState.gameOver = true
            newState.deathTime = Date.now()
            newState.particles = createExplosion(GAME_WIDTH / 2, Math.max(BIRD_SIZE, Math.min(newState.birdY, GAME_HEIGHT - 50 - BIRD_SIZE)))
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

    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
    gradient.addColorStop(0, COLORS.sky)
    gradient.addColorStop(1, COLORS.skyGradient)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Draw ground
    const groundY = GAME_HEIGHT - 50
    ctx.fillStyle = COLORS.ground
    ctx.fillRect(0, groundY, GAME_WIDTH, 50)
    // Ground stripes
    ctx.fillStyle = COLORS.groundDark
    for (let i = 0; i < GAME_WIDTH; i += 40) {
      ctx.fillRect(i, groundY, 20, 50)
    }
    // Ground top border
    ctx.fillStyle = '#5a7d2a'
    ctx.fillRect(0, groundY - 8, GAME_WIDTH, 8)

    // Draw pipes
    for (const pipe of state.pipes) {
      // Pipe shadow/border
      drawPixelRect(ctx, pipe.x + 4, 0, PIPE_WIDTH, pipe.topHeight, COLORS.pipeBorder, 4)
      drawPixelRect(ctx, pipe.x + 4, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, GAME_HEIGHT - pipe.topHeight - PIPE_GAP, COLORS.pipeBorder, 4)

      // Top pipe
      drawPixelRect(ctx, pipe.x, 0, PIPE_WIDTH, pipe.topHeight, COLORS.pipe, 4)
      // Top pipe highlight
      drawPixelRect(ctx, pipe.x, 0, 8, pipe.topHeight, COLORS.pipeLight, 4)
      // Top pipe shadow
      drawPixelRect(ctx, pipe.x + PIPE_WIDTH - 8, 0, 8, pipe.topHeight, COLORS.pipeDark, 4)

      // Bottom pipe
      drawPixelRect(ctx, pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, GAME_HEIGHT - pipe.topHeight - PIPE_GAP, COLORS.pipe, 4)
      // Bottom pipe highlight
      drawPixelRect(ctx, pipe.x, pipe.topHeight + PIPE_GAP, 8, GAME_HEIGHT - pipe.topHeight - PIPE_GAP, COLORS.pipeLight, 4)
      // Bottom pipe shadow
      drawPixelRect(ctx, pipe.x + PIPE_WIDTH - 8, pipe.topHeight + PIPE_GAP, 8, GAME_HEIGHT - pipe.topHeight - PIPE_GAP, COLORS.pipeDark, 4)

      // Pipe caps
      const capHeight = 24
      // Top cap
      drawPixelRect(ctx, pipe.x - 4, pipe.topHeight - capHeight, PIPE_WIDTH + 8, capHeight, COLORS.pipe, 4)
      drawPixelRect(ctx, pipe.x - 4, pipe.topHeight - capHeight, 8, capHeight, COLORS.pipeLight, 4)
      drawPixelRect(ctx, pipe.x + PIPE_WIDTH - 4, pipe.topHeight - capHeight, 8, capHeight, COLORS.pipeDark, 4)
      drawPixelRect(ctx, pipe.x - 4, pipe.topHeight - capHeight, PIPE_WIDTH + 8, 4, COLORS.pipeBorder, 4)

      // Bottom cap
      drawPixelRect(ctx, pipe.x - 4, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 8, capHeight, COLORS.pipe, 4)
      drawPixelRect(ctx, pipe.x - 4, pipe.topHeight + PIPE_GAP, 8, capHeight, COLORS.pipeLight, 4)
      drawPixelRect(ctx, pipe.x + PIPE_WIDTH - 4, pipe.topHeight + PIPE_GAP, 8, capHeight, COLORS.pipeDark, 4)
      drawPixelRect(ctx, pipe.x - 4, pipe.topHeight + PIPE_GAP + capHeight - 4, PIPE_WIDTH + 8, 4, COLORS.pipeBorder, 4)
    }

    // Draw bird (if not in death animation)
    if (state.particles.length === 0) {
      ctx.save()
      ctx.translate(GAME_WIDTH / 2, state.birdY)
      ctx.rotate(state.birdRotation)

      // Bird body (pixelated)
      const birdOffset = -BIRD_SIZE / 2
      drawPixelRect(ctx, birdOffset, birdOffset, BIRD_SIZE, BIRD_SIZE, COLORS.bird, 4)
      // Bird shadow
      drawPixelRect(ctx, birdOffset + 4, birdOffset + 16, BIRD_SIZE - 4, 8, COLORS.birdDark, 4)
      // Bird wing
      drawPixelRect(ctx, birdOffset - 4, birdOffset + 8, 12, 10, COLORS.birdDark, 4)

      // Bird eye
      drawPixelCircle(ctx, birdOffset + 14, birdOffset + 8, 6, COLORS.birdEye, 4)
      drawPixelCircle(ctx, birdOffset + 16, birdOffset + 8, 3, COLORS.birdPupil, 4)

      // Bird beak
      ctx.fillStyle = COLORS.birdBeak
      ctx.beginPath()
      ctx.moveTo(birdOffset + 18, birdOffset + 10)
      ctx.lineTo(birdOffset + 28, birdOffset + 14)
      ctx.lineTo(birdOffset + 18, birdOffset + 18)
      ctx.fill()

      ctx.restore()
    }

    // Draw particles
    for (const p of state.particles) {
      const alpha = p.life / p.maxLife
      ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0')
      const size = 6 * alpha
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size)
    }

    // Draw score
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 3
    ctx.font = 'bold 32px "Courier New", monospace'
    ctx.textAlign = 'center'
    const scoreText = state.score.toString()
    ctx.strokeText(scoreText, GAME_WIDTH / 2, 50)
    ctx.fillText(scoreText, GAME_WIDTH / 2, 50)
    ctx.textAlign = 'left'

    // Draw game over screen
    if (state.gameOver) {
      const overlayAlpha = Math.min(0.8, (Date.now() - (state.deathTime || 0)) / 400)
      ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

      if (overlayAlpha >= 0.8) {
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 4
        ctx.font = 'bold 36px "Courier New", monospace'
        ctx.textAlign = 'center'

        const centerX = GAME_WIDTH / 2
        const centerY = GAME_HEIGHT / 2

        ctx.strokeText('GAME OVER', centerX, centerY - 60)
        ctx.fillText('GAME OVER', centerX, centerY - 60)

        ctx.font = 'bold 24px "Courier New", monospace'
        ctx.strokeText(`SCORE: ${state.score}`, centerX, centerY)
        ctx.fillText(`SCORE: ${state.score}`, centerX, centerY)

        ctx.strokeText(`BEST: ${state.highScore}`, centerX, centerY + 35)
        ctx.fillText(`BEST: ${state.highScore}`, centerX, centerY + 35)

        if (state.score >= state.highScore && state.score > 0) {
          ctx.fillStyle = '#ffd700'
          ctx.strokeStyle = '#000'
          ctx.font = 'bold 20px "Courier New", monospace'
          ctx.strokeText('NEW RECORD!', centerX, centerY + 70)
          ctx.fillText('NEW RECORD!', centerX, centerY + 70)
        }

        ctx.fillStyle = '#fff'
        ctx.font = '16px "Courier New", monospace'
        const canRestart = !state.deathTime || Date.now() - state.deathTime >= DEATH_ANIMATION_DURATION
        if (canRestart) {
          ctx.strokeText('CLICK TO RESTART', centerX, centerY + 110)
          ctx.fillText('CLICK TO RESTART', centerX, centerY + 110)
        }

        ctx.textAlign = 'left'
      }
    }

    // Draw start screen
    if (!state.gameStarted && !state.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 4
      ctx.font = 'bold 32px "Courier New", monospace'
      ctx.textAlign = 'center'

      const centerX = GAME_WIDTH / 2
      const centerY = GAME_HEIGHT / 2

      ctx.strokeText('FLAPPY BIRD', centerX, centerY - 40)
      ctx.fillText('FLAPPY BIRD', centerX, centerY - 40)

      ctx.font = '16px "Courier New", monospace'
      ctx.strokeText('CLICK OR SPACE TO FLY', centerX, centerY + 20)
      ctx.fillText('CLICK OR SPACE TO FLY', centerX, centerY + 20)

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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 font-mono tracking-wider"
            style={{ textShadow: '2px 2px 0 #000' }}>
          FLAPPY BIRD
        </h1>
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onClick={jump}
          onTouchStart={(e) => {
            e.preventDefault()
            jump()
          }}
          className="border-4 border-gray-700 rounded-lg cursor-pointer touch-none max-w-full"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="mt-4 text-gray-300 text-sm font-mono">
          <p>HIGH SCORE: <span className="text-yellow-400 font-bold text-lg">{state.highScore}</span></p>
          <p className="mt-2 text-xs text-gray-500">CLICK, SPACE, OR TAP TO FLY</p>
        </div>
      </div>
    </div>
  )
}

export default App
