import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StartScreen } from '../components/StartScreen'
import { GameOverScreen } from '../components/GameOverScreen'

describe('StartScreen Component', () => {
  it('renders game title', () => {
    render(<StartScreen onStart={vi.fn()} />)
    
    expect(screen.getByText('FLAPPY BIRD')).toBeTruthy()
  })

  it('renders instructions', () => {
    render(<StartScreen onStart={vi.fn()} />)
    
    expect(screen.getByText('Click or Space to fly')).toBeTruthy()
  })

  it('calls onStart when clicked', () => {
    const onStart = vi.fn()
    render(<StartScreen onStart={onStart} />)
    
    fireEvent.click(screen.getByTestId('start-screen'))
    
    expect(onStart).toHaveBeenCalled()
  })

  it('has correct test id', () => {
    render(<StartScreen onStart={vi.fn()} />)
    
    expect(screen.getByTestId('start-screen')).toBeTruthy()
  })

  it('renders animated bird indicator', () => {
    render(<StartScreen onStart={vi.fn()} />)
    
    const bird = document.querySelector('.animate-bounce')
    expect(bird).toBeTruthy()
  })
})

describe('GameOverScreen Component', () => {
  it('renders game over title', () => {
    render(<GameOverScreen score={10} highScore={20} onRestart={vi.fn()} />)
    
    expect(screen.getByText('GAME OVER')).toBeTruthy()
  })

  it('renders new high score title when score equals high score', () => {
    render(<GameOverScreen score={20} highScore={20} onRestart={vi.fn()} />)
    
    expect(screen.getByText('NEW HIGH SCORE!')).toBeTruthy()
  })

  it('displays current score', () => {
    render(<GameOverScreen score={15} highScore={20} onRestart={vi.fn()} />)
    
    expect(screen.getByText('15')).toBeTruthy()
  })

  it('displays high score', () => {
    render(<GameOverScreen score={15} highScore={25} onRestart={vi.fn()} />)
    
    expect(screen.getByText('25')).toBeTruthy()
  })

  it('displays score label', () => {
    render(<GameOverScreen score={10} highScore={20} onRestart={vi.fn()} />)
    
    expect(screen.getByText('Score')).toBeTruthy()
  })

  it('displays high score label', () => {
    render(<GameOverScreen score={10} highScore={20} onRestart={vi.fn()} />)
    
    expect(screen.getByText('High Score')).toBeTruthy()
  })

  it('calls onRestart when clicked', () => {
    const onRestart = vi.fn()
    render(<GameOverScreen score={10} highScore={20} onRestart={onRestart} />)
    
    fireEvent.click(screen.getByTestId('game-over-overlay'))
    
    expect(onRestart).toHaveBeenCalled()
  })

  it('renders restart instruction', () => {
    render(<GameOverScreen score={10} highScore={20} onRestart={vi.fn()} />)
    
    expect(screen.getByText('Click to restart')).toBeTruthy()
  })

  it('has correct test id', () => {
    render(<GameOverScreen score={10} highScore={20} onRestart={vi.fn()} />)
    
    expect(screen.getByTestId('game-over-overlay')).toBeTruthy()
  })

  it('shows score of 0 correctly', () => {
    render(<GameOverScreen score={0} highScore={10} onRestart={vi.fn()} />)
    
    // Should not show "NEW HIGH SCORE!" when score is 0
    expect(screen.queryByText('NEW HIGH SCORE!')).toBeNull()
    expect(screen.getByText('GAME OVER')).toBeTruthy()
  })
})
