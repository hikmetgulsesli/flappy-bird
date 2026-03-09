import React from 'react'

interface StartScreenProps {
  onStart: () => void
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 cursor-pointer"
      onClick={onStart}
      data-testid="start-screen"
    >
      <h2 
        className="text-4xl font-bold mb-4"
        style={{ 
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-primary)',
          textShadow: '2px 2px 0 #000',
        }}
      >
        FLAPPY BIRD
      </h2>
      <p 
        className="text-lg"
        style={{ 
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-primary)',
        }}
      >
        Click or Space to fly
      </p>
      <div className="mt-8 animate-bounce">
        <div 
          className="w-8 h-8 rounded-full"
          style={{ backgroundColor: 'var(--color-bird-yellow)' }}
        />
      </div>
    </div>
  )
}

export default StartScreen
