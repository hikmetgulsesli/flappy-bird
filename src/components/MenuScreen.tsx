import { useEffect, useCallback } from 'react'
import '../index.css'

interface MenuScreenProps {
  highScore: number
  onStart: () => void
}

export function MenuScreen({ highScore, onStart }: MenuScreenProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        onStart()
      }
    },
    [onStart]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onStart}
      onTouchStart={(e) => {
        e.preventDefault()
        onStart()
      }}
      data-testid="menu-screen"
    >
      <h1
        className="font-mono font-bold text-center select-none"
        style={{
          fontSize: '36px',
          color: '#ffffff',
          textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
          marginBottom: '20px',
        }}
        data-testid="menu-title"
      >
        FLAPPY BIRD
      </h1>
      <p
        className="font-mono text-center select-none"
        style={{
          fontSize: '18px',
          color: '#ffffff',
          marginBottom: '30px',
        }}
        data-testid="menu-instruction"
      >
        Tap or Space to Start
      </p>
      <div
        className="font-mono text-center select-none"
        style={{
          fontSize: '20px',
          color: '#ffd700',
        }}
        data-testid="menu-highscore"
      >
        High Score: {highScore}
      </div>
    </div>
  )
}

export default MenuScreen
