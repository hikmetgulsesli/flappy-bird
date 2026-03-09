import '../index.css'

interface MenuScreenProps {
  highScore: number
  onStart: () => void
}

export function MenuScreen({ highScore, onStart }: MenuScreenProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/50"
      onClick={onStart}
      onTouchStart={(e) => {
        e.preventDefault()
        onStart()
      }}
      data-testid="menu-screen"
    >
      <h1
        className="font-mono font-bold text-center select-none text-[36px] text-white mb-[20px] [text-shadow:-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000]"
        data-testid="menu-title"
      >
        FLAPPY BIRD
      </h1>
      <p
        className="font-mono text-center select-none text-[18px] text-white mb-[30px]"
        data-testid="menu-instruction"
      >
        Tap or Space to Start
      </p>
      <div
        className="font-mono text-center select-none text-[20px] text-[#ffd700]"
        data-testid="menu-highscore"
      >
        High Score: {highScore}
      </div>
    </div>
  )
}
