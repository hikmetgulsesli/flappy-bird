import React, { useCallback } from 'react'
import './GameOverScreen.css'

interface GameOverScreenProps {
  score: number
  highScore: number
  onRestart: () => void
  isVisible: boolean
}

export function GameOverScreen({ score, highScore, onRestart, isVisible }: GameOverScreenProps) {
  const handleClick = useCallback(() => {
    onRestart()
  }, [onRestart])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault()
      onRestart()
    }
  }, [onRestart])

  if (!isVisible) return null

  return (
    <div
      className="game-over-overlay"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Game Over"
      tabIndex={0}
      data-testid="game-over-overlay"
    >
      <div className="game-over-box" data-testid="game-over-box">
        <h2 className="game-over-title" data-testid="game-over-title">GAME OVER</h2>
        <p className="game-over-score" data-testid="game-over-current-score">
          Score: {score}
        </p>
        <p className="game-over-score" data-testid="game-over-best-score">
          Best: {highScore}
        </p>
        <p className="game-over-restart" data-testid="game-over-restart">
          Tap to Restart
        </p>
      </div>
    </div>
  )
}
