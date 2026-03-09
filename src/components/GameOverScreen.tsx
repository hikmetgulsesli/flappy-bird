import React from 'react'

interface GameOverScreenProps {
  score: number
  highScore: number
  onRestart: () => void
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  score, 
  highScore, 
  onRestart 
}) => {
  const isNewHighScore = score > 0 && score >= highScore

  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 cursor-pointer"
      onClick={onRestart}
      data-testid="game-over-overlay"
    >
      <h2 
        className="text-3xl font-bold mb-6"
        style={{ 
          fontFamily: 'var(--font-mono)',
          color: isNewHighScore ? 'var(--color-gold)' : 'var(--color-text-primary)',
          textShadow: '2px 2px 0 #000',
        }}
      >
        {isNewHighScore ? 'NEW HIGH SCORE!' : 'GAME OVER'}
      </h2>
      
      <div className="bg-black/50 p-6 rounded-lg mb-6">
        <div className="text-center mb-4">
          <span 
            className="text-lg block mb-1"
            style={{ 
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-primary)',
            }}
          >
            Score
          </span>
          <span 
            className="text-4xl font-bold"
            style={{ 
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-primary)',
            }}
          >
            {score}
          </span>
        </div>
        
        <div className="text-center">
          <span 
            className="text-lg block mb-1"
            style={{ 
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-gold)',
            }}
          >
            High Score
          </span>
          <span 
            className="text-3xl font-bold"
            style={{ 
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-gold)',
            }}
          >
            {highScore}
          </span>
        </div>
      </div>

      <p 
        className="text-base animate-pulse"
        style={{ 
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-primary)',
        }}
      >
        Click to restart
      </p>
    </div>
  )
}

export default GameOverScreen
