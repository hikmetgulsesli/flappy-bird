import { useEffect, useRef, useCallback } from 'react'
import './index.css'
import { useGameState } from './hooks/useGameState'
import { StartScreen, GameOverScreen, GameCanvas } from './components'

const JUMP_STRENGTH = -8

function App() {
  const { state, jump, updateGame, resetGame, startGame } = useGameState()
  const animationRef = useRef<number>()
  const frameCountRef = useRef(0)
  const velocityRef = useRef(0)

  // Main game loop that integrates all systems
  const gameLoop = useCallback(() => {
    frameCountRef.current++
    const newVelocity = updateGame(frameCountRef.current, velocityRef.current)
    if (newVelocity !== undefined) {
      velocityRef.current = newVelocity
    }
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [updateGame])

  // Start/stop game loop based on state
  useEffect(() => {
    if (state.gameStarted && !state.gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [state.gameStarted, state.gameOver, gameLoop])

  // Handle jump with velocity reset
  const handleJump = useCallback(() => {
    if (state.gameOver) {
      velocityRef.current = 0
      resetGame()
      return
    }
    if (!state.gameStarted) {
      startGame()
    }
    velocityRef.current = JUMP_STRENGTH
    jump()
  }, [state.gameOver, state.gameStarted, jump, resetGame, startGame])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handleJump()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleJump])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 
          className="text-4xl font-bold mb-4"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span className="text-white">Flappy</span>{' '}
          <span style={{ color: 'var(--color-bird-yellow)' }}>Bird</span>
        </h1>
        
        <div className="relative inline-block image-pixelated">
          <GameCanvas state={state} onJump={handleJump} />
          
          {/* Start Screen Overlay */}
          {!state.gameStarted && !state.gameOver && (
            <StartScreen onStart={handleJump} />
          )}
          
          {/* Game Over Screen Overlay */}
          {state.gameOver && (
            <GameOverScreen 
              score={state.score} 
              highScore={state.highScore} 
              onRestart={handleJump} 
            />
          )}
        </div>
        
        <div className="mt-4 text-gray-400 text-sm">
          <p>
            High Score:{' '}
            <span 
              className="font-bold text-yellow-400"
            >
              {state.highScore}
            </span>
          </p>
          {!state.gameStarted && !state.gameOver && (
            <p className="mt-2">Click or Space to fly</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
