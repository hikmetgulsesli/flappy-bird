import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GameOverScreen } from '../components/GameOverScreen'

describe('GameOverScreen', () => {
  it('should not render when isVisible is false', () => {
    const { container } = render(
      <GameOverScreen
        score={10}
        highScore={20}
        onRestart={vi.fn()}
        isVisible={false}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render overlay with 60% black transparency when visible', () => {
    render(
      <GameOverScreen
        score={10}
        highScore={20}
        onRestart={vi.fn()}
        isVisible={true}
      />
    )
    const overlay = screen.getByTestId('game-over-overlay')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveClass('game-over-overlay')
    // Check that the overlay has the correct class for styling
    expect(overlay).toHaveClass('game-over-overlay')
  })

  it('should display beige score box with black border', () => {
    render(
      <GameOverScreen
        score={10}
        highScore={20}
        onRestart={vi.fn()}
        isVisible={true}
      />
    )
    const box = screen.getByTestId('game-over-box')
    expect(box).toBeInTheDocument()
    expect(box).toHaveClass('game-over-box')
  })

  it('should display GAME OVER header in red 28px bold', () => {
    render(
      <GameOverScreen
        score={10}
        highScore={20}
        onRestart={vi.fn()}
        isVisible={true}
      />
    )
    const title = screen.getByTestId('game-over-title')
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('GAME OVER')
    expect(title).toHaveClass('game-over-title')
  })

  it('should display current score in 20px', () => {
    render(
      <GameOverScreen
        score={42}
        highScore={100}
        onRestart={vi.fn()}
        isVisible={true}
      />
    )
    const scoreElement = screen.getByTestId('game-over-current-score')
    expect(scoreElement).toBeInTheDocument()
    expect(scoreElement).toHaveTextContent('Score: 42')
    expect(scoreElement).toHaveClass('game-over-score')
  })

  it('should display best score in 20px', () => {
    render(
      <GameOverScreen
        score={42}
        highScore={100}
        onRestart={vi.fn()}
        isVisible={true}
      />
    )
    const bestScoreElement = screen.getByTestId('game-over-best-score')
    expect(bestScoreElement).toBeInTheDocument()
    expect(bestScoreElement).toHaveTextContent('Best: 100')
    expect(bestScoreElement).toHaveClass('game-over-score')
  })

  it('should display Tap to Restart in green 16px', () => {
    render(
      <GameOverScreen
        score={10}
        highScore={20}
        onRestart={vi.fn()}
        isVisible={true}
      />
    )
    const restartElement = screen.getByTestId('game-over-restart')
    expect(restartElement).toBeInTheDocument()
    expect(restartElement).toHaveTextContent('Tap to Restart')
    expect(restartElement).toHaveClass('game-over-restart')
  })

  it('should call onRestart when overlay is clicked', () => {
    const onRestart = vi.fn()
    render(
      <GameOverScreen
        score={10}
        highScore={20}
        onRestart={onRestart}
        isVisible={true}
      />
    )
    const overlay = screen.getByTestId('game-over-overlay')
    fireEvent.click(overlay)
    expect(onRestart).toHaveBeenCalledTimes(1)
  })

  it('should call onRestart when Enter key is pressed', () => {
    const onRestart = vi.fn()
    render(
      <GameOverScreen
        score={10}
        highScore={20}
        onRestart={onRestart}
        isVisible={true}
      />
    )
    const overlay = screen.getByTestId('game-over-overlay')
    fireEvent.keyDown(overlay, { code: 'Enter' })
    expect(onRestart).toHaveBeenCalledTimes(1)
  })

  it('should call onRestart when Space key is pressed', () => {
    const onRestart = vi.fn()
    render(
      <GameOverScreen
        score={10}
        highScore={20}
        onRestart={onRestart}
        isVisible={true}
      />
    )
    const overlay = screen.getByTestId('game-over-overlay')
    fireEvent.keyDown(overlay, { code: 'Space' })
    expect(onRestart).toHaveBeenCalledTimes(1)
  })

  it('should have correct ARIA attributes for accessibility', () => {
    render(
      <GameOverScreen
        score={10}
        highScore={20}
        onRestart={vi.fn()}
        isVisible={true}
      />
    )
    const overlay = screen.getByTestId('game-over-overlay')
    expect(overlay).toHaveAttribute('role', 'dialog')
    expect(overlay).toHaveAttribute('aria-modal', 'true')
    expect(overlay).toHaveAttribute('aria-label', 'Game Over')
  })
})
