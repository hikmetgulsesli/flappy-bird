import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App Background and Visual Effects', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    })
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => setTimeout(cb, 16)))
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => clearTimeout(id)))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders canvas with correct dimensions', () => {
    const { container } = render(<App />)
    const canvas = container.querySelector('canvas') as HTMLCanvasElement
    expect(canvas).toBeDefined()
    expect(canvas.width).toBe(288)
    expect(canvas.height).toBe(512)
  })

  it('renders game title', () => {
    render(<App />)
    expect(screen.getByText('Flappy Bird')).toBeDefined()
  })

  it('initializes with correct default state', () => {
    const { container } = render(<App />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })
})

describe('Background Rendering', () => {
  it('canvas has pixelated rendering style', () => {
    const { container } = render(<App />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeTruthy()
    expect(canvas?.style.imageRendering).toBe('pixelated')
  })
})
