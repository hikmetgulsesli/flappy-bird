import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MenuScreen } from '../components/MenuScreen'

describe('MenuScreen', () => {
  it('renders with 50% black transparency overlay', () => {
    render(<MenuScreen highScore={100} onStart={vi.fn()} />)
    const menuScreen = screen.getByTestId('menu-screen')
    expect(menuScreen).toBeInTheDocument()
    // Check inline style for background color
    expect(menuScreen.getAttribute('style')).toContain('background-color: rgba(0, 0, 0, 0.5)')
  })

  it('displays FLAPPY BIRD title in 36px bold white with black outline', () => {
    render(<MenuScreen highScore={100} onStart={vi.fn()} />)
    const title = screen.getByTestId('menu-title')
    expect(title).toHaveTextContent('FLAPPY BIRD')
    // Check inline styles
    const style = title.getAttribute('style')
    expect(style).toContain('font-size: 36px')
    expect(style).toContain('color: rgb(255, 255, 255)')
    expect(style).toContain('text-shadow')
    expect(style).toContain('#000')
  })

  it('displays instruction text below title', () => {
    render(<MenuScreen highScore={100} onStart={vi.fn()} />)
    const instruction = screen.getByTestId('menu-instruction')
    expect(instruction).toHaveTextContent('Tap or Space to Start')
    const style = instruction.getAttribute('style')
    expect(style).toContain('font-size: 18px')
  })

  it('displays high score on menu screen', () => {
    render(<MenuScreen highScore={150} onStart={vi.fn()} />)
    const highScoreDisplay = screen.getByTestId('menu-highscore')
    expect(highScoreDisplay).toHaveTextContent('High Score: 150')
  })

  it('calls onStart when clicked', () => {
    const onStart = vi.fn()
    render(<MenuScreen highScore={100} onStart={onStart} />)
    const menuScreen = screen.getByTestId('menu-screen')
    fireEvent.click(menuScreen)
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('calls onStart when Space key is pressed', () => {
    const onStart = vi.fn()
    render(<MenuScreen highScore={100} onStart={onStart} />)
    fireEvent.keyDown(window, { code: 'Space' })
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('calls onStart on touch start', () => {
    const onStart = vi.fn()
    render(<MenuScreen highScore={100} onStart={onStart} />)
    const menuScreen = screen.getByTestId('menu-screen')
    fireEvent.touchStart(menuScreen)
    expect(onStart).toHaveBeenCalledTimes(1)
  })
})
