import { useEffect, useRef, useState, useCallback } from 'react'
import { GameCanvas } from './components/GameCanvas'
import './index.css'
import { MenuScreen } from './components/MenuScreen'

const GAME_WIDTH = 288
const GAME_HEIGHT = 512
const BIRD_SIZE = 24
const PIPE_WIDTH = 52
const PIPE_GAP = 140
const GRAVITY = 0.4
const JUMP_STRENGTH = -7
const PIPE_SPEED = 2.5
const DEATH_ANIMATION_DURATION = 800
const MAX_DELTA_TIME = 100 // Cap delta time to prevent large jumps

type GameStateType = 'menu' | 'playing' | 'gameOver'

// Get colors from CSS variables (with fallbacks)
function getCSSVar(name: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback
  try {
    return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
  } catch {
    return fallback
  }
}

// Color palette using CSS custom properties with fallbacks
const getColors = () => ({
  sky: getCSSVar('--color-sky-cyan', '#4EC0CA'),
  skyGradient: getCSSVar('--color-sky-gradient', '#70c5ce'),
  skyLight: getCSSVar('--color-sky-light', '#a8e6cf'),
  bird: getCSSVar('--color-bird-yellow', '#F4D03F'),
  birdDark: getCSSVar('--color-bird-dark', '#d4ac0d'),
  birdEye: getCSSVar('--color-bird-eye', '#ffffff'),
  birdPupil: getCSSVar('--color-bird-pupil', '#000000'),
  birdBeak: getCSSVar('--color-bird-beak', '#E67E22'),
  pipe: getCSSVar('--color-pipe-green', '#73BF2E'),
  pipeLight: getCSSVar('--color-pipe-light', '#a0de6e'),
  pipeDark: getCSSVar('--color-pipe-dark', '#5a9a1e'),
  pipeBorder: getCSSVar('--color-pipe-border', '#2d5016'),
  pipeGreenDark: getCSSVar('--color-pipe-green-dark', '#558B2F'),
  ground: getCSSVar('--color-sand-ground', '#DED895'),
  groundDark: getCSSVar('--color-sand-dark', '#d4c76a'),
  groundBorder: getCSSVar('--color-ground-border', '#5a7d2a'),
  textPrimary: getCSSVar('--color-text-primary', '#ffffff'),
  textDark: getCSSVar('--color-text-dark', '#000000'),
  gold: getCSSVar('--color-gold', '#ffd700'),
  particle1: getCSSVar('--color-particle-1', '#ff6b6b'),
  particle2: getCSSVar('--color-particle-2', '#F4D03F'),
  particle3: getCSSVar('--color-particle-3', '#E67E22'),
  particle4: getCSSVar('--color-particle-4', '#d4ac0d'),
})

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
  gameState: GameStateType
  deathTime: number | null
  particles: Particle[]
}

function createExplosion(x: number, y: number, colors: Record<string, string>): Particle[] {
  const particles: Particle[] = []
  const particleColors = [colors.bird, colors.birdDark, colors.birdBeak, colors.particle1]
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
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
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
  const frameCountRef = useRef(0)
  const colorsRef = useRef(getColors())
  
  // Use ref for game state to avoid re-renders on every frame
  const gameStateRef = useRef<GameState>({
    birdY: GAME_HEIGHT / 2,
    birdVelocity: 0,
    birdRotation: 0,
    pipes: [],
    score: 0,
    gameState: 'menu',
    deathTime: null,
    particles: [],
  })

  // Only use state for values that need to trigger React re-renders
  const [displayHighScore, setDisplayHighScore] = useState(0)
  const [currentGameState, setCurrentGameState] = useState<GameStateType>('menu')

  // Load high score from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flappyHighScore')
      const parsed = saved ? parseInt(saved, 10) : 0
      setDisplayHighScore(isNaN(parsed) ? 0 : parsed)
    }
    // Update colors when component mounts (for SSR compatibility)
    colorsRef.current = getColors()
  }, [])

  const startGame = useCallback(() => {
    gameStateRef.current.gameState = 'playing'
    setCurrentGameState('playing')
  }, [])

  const resetGame = useCallback(() => {
    frameCountRef.current = 0
    gameStateRef.current = {
      birdY: GAME_HEIGHT / 2,
      birdVelocity: 0,
      birdRotation: 0,
      pipes: [],
      score: 0,
      gameState: 'playing',
      deathTime: null,
      particles: [],
    }
    setCurrentGameState('playing')
  }, [])

  const jump = useCallback(() => {
    const state = gameStateRef.current
    if (state.gameState === 'gameOver') {
      // Wait for death animation to complete
      if (state.deathTime && Date.now() - state.deathTime < DEATH_ANIMATION_DURATION) {
        return
      }
      resetGame()
      return
    }
    if (state.gameState === 'menu') {
      startGame()
      return
    }
    gameStateRef.current.birdVelocity = JUMP_STRENGTH
  }, [resetGame, startGame])

  // Game update logic - uses ref to avoid re-renders
  const handleUpdate = useCallback((deltaTime: number) => {
    // Cap delta time to prevent large jumps
    const cappedDeltaTime = Math.min(deltaTime, MAX_DELTA_TIME)
    
    const state = gameStateRef.current
    
    if (state.gameState === 'gameOver' && state.particles.length === 0) {
      return
    }

    // Update particles
    if (state.particles.length > 0) {
      state.particles = state.particles
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.1,
          life: p.life - cappedDeltaTime,
        }))
        .filter(p => p.life > 0)
    }

    if (state.gameState === 'playing') {
      // Apply gravity
      state.birdVelocity += GRAVITY
      state.birdY += state.birdVelocity

      // Update bird rotation based on velocity
      state.birdRotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (state.birdVelocity * Math.PI) / 20))

      // Generate pipes
      frameCountRef.current++
      if (frameCountRef.current % 120 === 0) {
        const minHeight = 60
        const maxHeight = GAME_HEIGHT - PIPE_GAP - minHeight - 100
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight) + minHeight)
        state.pipes = [...state.pipes, { x: GAME_WIDTH, topHeight, passed: false }]
      }

      // Move pipes
      state.pipes = state.pipes
        .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
        .filter(pipe => pipe.x + PIPE_WIDTH > 0)

      // Check collisions and score
      const birdLeft = GAME_WIDTH / 2 - BIRD_SIZE / 2
      const birdRight = birdLeft + BIRD_SIZE
      const birdTop = state.birdY - BIRD_SIZE / 2
      const birdBottom = birdTop + BIRD_SIZE

      let isGameOver = false
      let collisionY = state.birdY

      for (const pipe of state.pipes) {
        // Score counting
        if (!pipe.passed && pipe.x + PIPE_WIDTH < birdLeft) {
          pipe.passed = true
          state.score++
          if (state.score > displayHighScore) {
            setDisplayHighScore(state.score)
            if (typeof window !== 'undefined') {
              localStorage.setItem('flappyHighScore', state.score.toString())
            }
          }
        }

        // Collision detection
        const pipeLeft = pipe.x
        const pipeRight = pipe.x + PIPE_WIDTH

        // Check horizontal overlap
        if (birdRight > pipeLeft && birdLeft < pipeRight) {
          // Check vertical collision with top pipe
          if (birdTop < pipe.topHeight) {
            isGameOver = true
          }
          // Check vertical collision with bottom pipe
          if (birdBottom > pipe.topHeight + PIPE_GAP) {
            isGameOver = true
          }
        }
      }

      // Ground/ceiling collision
      if (state.birdY < BIRD_SIZE / 2 || state.birdY > GAME_HEIGHT - BIRD_SIZE / 2 - 50) {
        isGameOver = true
        collisionY = Math.max(BIRD_SIZE, Math.min(state.birdY, GAME_HEIGHT - 50 - BIRD_SIZE))
      }

      // Single game over state setting (centralized logic)
      if (isGameOver) {
        state.gameState = 'gameOver'
        state.deathTime = Date.now()
        state.particles = createExplosion(GAME_WIDTH / 2, collisionY, colorsRef.current)
        setCurrentGameState('gameOver')
      }
    }
  }, [displayHighScore, resetGame])

  // Game render logic - reads from ref, no state dependency
  const handleRender = useCallback((ctx: CanvasRenderingContext2D) => {
    const colors = colorsRef.current
    const state = gameStateRef.current

    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
    gradient.addColorStop(0, colors.sky)
    gradient.addColorStop(1, colors.skyLight)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Draw ground
    const groundY = GAME_HEIGHT - 50
    ctx.fillStyle = colors.ground
    ctx.fillRect(0, groundY, GAME_WIDTH, 50)
    // Ground stripes
    ctx.fillStyle = colors.groundDark
    for (let i = 0; i < GAME_WIDTH; i += 40) {
      ctx.fillRect(i, groundY, 20, 50)
    }
    // Ground top border
    ctx.fillStyle = colors.groundBorder
    ctx.fillRect(0, groundY - 8, GAME_WIDTH, 8)

    // Draw pipes
    for (const pipe of state.pipes) {
      // Pipe shadow/border
      drawPixelRect(ctx, pipe.x + 4, 0, PIPE_WIDTH, pipe.topHeight, colors.pipeBorder, 4)
      drawPixelRect(ctx, pipe.x + 4, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, GAME_HEIGHT - pipe.topHeight - PIPE_GAP, colors.pipeBorder, 4)

      // Top pipe
      drawPixelRect(ctx, pipe.x, 0, PIPE_WIDTH, pipe.topHeight, colors.pipe, 4)
      // Top pipe highlight
      drawPixelRect(ctx, pipe.x, 0, 8, pipe.topHeight, colors.pipeLight, 4)
      // Top pipe shadow
      drawPixelRect(ctx, pipe.x + PIPE_WIDTH - 8, 0, 8, pipe.topHeight, colors.pipeDark, 4)

      // Bottom pipe
      drawPixelRect(ctx, pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, GAME_HEIGHT - pipe.topHeight - PIPE_GAP, colors.pipe, 4)
      // Bottom pipe highlight
      drawPixelRect(ctx, pipe.x, pipe.topHeight + PIPE_GAP, 8, GAME_HEIGHT - pipe.topHeight - PIPE_GAP, colors.pipeLight, 4)
      // Bottom pipe shadow
      drawPixelRect(ctx, pipe.x + PIPE_WIDTH - 8, pipe.topHeight + PIPE_GAP, 8, GAME_HEIGHT - pipe.topHeight - PIPE_GAP, colors.pipeDark, 4)

      // Pipe caps
      const capHeight = 24
      // Top cap
      drawPixelRect(ctx, pipe.x - 4, pipe.topHeight - capHeight, PIPE_WIDTH + 8, capHeight, colors.pipe, 4)
      drawPixelRect(ctx, pipe.x - 4, pipe.topHeight - capHeight, 8, capHeight, colors.pipeLight, 4)
      drawPixelRect(ctx, pipe.x + PIPE_WIDTH - 4, pipe.topHeight - capHeight, 8, capHeight, colors.pipeDark, 4)
      drawPixelRect(ctx, pipe.x - 4, pipe.topHeight - capHeight, PIPE_WIDTH + 8, 4, colors.pipeBorder, 4)

      // Bottom cap
      drawPixelRect(ctx, pipe.x - 4, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 8, capHeight, colors.pipe, 4)
      drawPixelRect(ctx, pipe.x - 4, pipe.topHeight + PIPE_GAP, 8, capHeight, colors.pipeLight, 4)
      drawPixelRect(ctx, pipe.x + PIPE_WIDTH - 4, pipe.topHeight + PIPE_GAP, 8, capHeight, colors.pipeDark, 4)
      drawPixelRect(ctx, pipe.x - 4, pipe.topHeight + PIPE_GAP + capHeight - 4, PIPE_WIDTH + 8, 4, colors.pipeBorder, 4)
    }

    // Draw bird (if not in death animation)
    if (state.particles.length === 0) {
      ctx.save()
      ctx.translate(GAME_WIDTH / 2, state.birdY)
      ctx.rotate(state.birdRotation)

      // Bird body (pixelated)
      const birdOffset = -BIRD_SIZE / 2
      drawPixelRect(ctx, birdOffset, birdOffset, BIRD_SIZE, BIRD_SIZE, colors.bird, 4)
      // Bird shadow
      drawPixelRect(ctx, birdOffset + 4, birdOffset + 16, BIRD_SIZE - 4, 8, colors.birdDark, 4)
      // Bird wing
      drawPixelRect(ctx, birdOffset - 4, birdOffset + 8, 12, 10, colors.birdDark, 4)

      // Bird eye
      drawPixelCircle(ctx, birdOffset + 14, birdOffset + 8, 6, colors.birdEye, 4)
      drawPixelCircle(ctx, birdOffset + 16, birdOffset + 8, 3, colors.birdPupil, 4)

      // Bird beak
      ctx.fillStyle = colors.birdBeak
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
    ctx.fillStyle = colors.textPrimary
    ctx.strokeStyle = colors.textDark
    ctx.lineWidth = 3
    ctx.font = 'bold 32px "Courier New", monospace'
    ctx.textAlign = 'center'
    const scoreText = state.score.toString()
    ctx.strokeText(scoreText, GAME_WIDTH / 2, 50)
    ctx.fillText(scoreText, GAME_WIDTH / 2, 50)
    ctx.textAlign = 'left'

    // Draw game over screen
    if (state.gameState === 'gameOver') {
      const overlayAlpha = Math.min(0.8, (Date.now() - (state.deathTime || 0)) / 400)
      ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

      if (overlayAlpha >= 0.8) {
        ctx.fillStyle = colors.textPrimary
        ctx.strokeStyle = colors.textDark
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

        ctx.strokeText(`BEST: ${displayHighScore}`, centerX, centerY + 35)
        ctx.fillText(`BEST: ${displayHighScore}`, centerX, centerY + 35)

        if (state.score >= displayHighScore && state.score > 0) {
          ctx.fillStyle = colors.gold
          ctx.strokeStyle = colors.textDark
          ctx.font = 'bold 20px "Courier New", monospace'
          ctx.strokeText('NEW RECORD!', centerX, centerY + 70)
          ctx.fillText('NEW RECORD!', centerX, centerY + 70)
        }

        ctx.fillStyle = colors.textPrimary
        ctx.font = '16px "Courier New", monospace'
        const canRestart = !state.deathTime || Date.now() - state.deathTime >= DEATH_ANIMATION_DURATION
        if (canRestart) {
          ctx.strokeText('CLICK TO RESTART', centerX, centerY + 110)
          ctx.fillText('CLICK TO RESTART', centerX, centerY + 110)
        }

        ctx.textAlign = 'left'
      }
    }
  }, [displayHighScore])

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
        <h1 
          className="text-3xl md:text-4xl font-bold text-white mb-4 font-retro tracking-wider"
          style={{ textShadow: '2px 2px 0 var(--color-text-dark)' }}
        >
          FLAPPY BIRD
        </h1>
        <div className="relative inline-block">
          <GameCanvas
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            onUpdate={handleUpdate}
            onRender={handleRender}
            onAction={jump}
            className="border-4 border-gray-700 rounded-lg max-w-full"
            isRunning={true}
          />
          {currentGameState === 'menu' && (
            <MenuScreen highScore={displayHighScore} onStart={startGame} />
          )}
        </div>
        <div className="mt-4 text-gray-300 text-sm font-retro">
          <p>
            HIGH SCORE: <span className="text-retro-gold font-bold text-lg">{displayHighScore}</span>
          </p>
          <p className="mt-2 text-xs text-gray-500">CLICK, SPACE, OR TAP TO FLY</p>
        </div>
      </div>
    </div>
  )
}

export default App
