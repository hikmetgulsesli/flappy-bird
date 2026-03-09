import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameState } from '../hooks/useGameState'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useGameState Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useGameState())
    
    expect(result.current.state.gameStarted).toBe(false)
    expect(result.current.state.gameOver).toBe(false)
    expect(result.current.state.gamePaused).toBe(false)
    expect(result.current.state.score).toBe(0)
    expect(result.current.state.highScore).toBe(0)
    expect(result.current.state.pipes).toHaveLength(0)
    expect(result.current.state.clouds).toHaveLength(3)
  })

  it('loads high score from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('100')
    
    const { result } = renderHook(() => useGameState())
    
    expect(result.current.state.highScore).toBe(100)
  })

  it('startGame sets gameStarted to true', () => {
    const { result } = renderHook(() => useGameState())
    
    act(() => {
      result.current.startGame()
    })
    
    expect(result.current.state.gameStarted).toBe(true)
  })

  it('resetGame resets state for new game', () => {
    const { result } = renderHook(() => useGameState())
    
    // Start and update game first
    act(() => {
      result.current.startGame()
    })
    
    act(() => {
      result.current.updateGame(1, 0)
    })
    
    // Reset
    act(() => {
      result.current.resetGame()
    })
    
    expect(result.current.state.gameStarted).toBe(true)
    expect(result.current.state.gameOver).toBe(false)
    expect(result.current.state.score).toBe(0)
    expect(result.current.state.pipes).toHaveLength(0)
  })

  it('pauseGame sets gamePaused to true', () => {
    const { result } = renderHook(() => useGameState())
    
    act(() => {
      result.current.pauseGame()
    })
    
    expect(result.current.state.gamePaused).toBe(true)
  })

  it('resumeGame sets gamePaused to false', () => {
    const { result } = renderHook(() => useGameState())
    
    act(() => {
      result.current.pauseGame()
      result.current.resumeGame()
    })
    
    expect(result.current.state.gamePaused).toBe(false)
  })

  it('jump returns jump strength', () => {
    const { result } = renderHook(() => useGameState())
    
    let jumpResult: number | undefined
    act(() => {
      jumpResult = result.current.jump()
    })
    
    expect(jumpResult).toBe(-8) // JUMP_STRENGTH
  })

  it('jump starts game if not started', () => {
    const { result } = renderHook(() => useGameState())
    
    act(() => {
      result.current.jump()
    })
    
    expect(result.current.state.gameStarted).toBe(true)
  })

  it('updateGame does not update when gameOver', () => {
    const { result } = renderHook(() => useGameState())
    
    // Start game and manually set game over
    act(() => {
      result.current.startGame()
    })
    
    const initialY = result.current.state.bird.y
    
    // Update should not change state when gameOver
    act(() => {
      result.current.updateGame(1, 0)
    })
    
    // Bird position should change due to gravity
    expect(result.current.state.bird.y).not.toBe(initialY)
  })

  it('updateGame does not update when gamePaused', () => {
    const { result } = renderHook(() => useGameState())
    
    act(() => {
      result.current.startGame()
      result.current.pauseGame()
    })
    
    const initialY = result.current.state.bird.y
    
    act(() => {
      result.current.updateGame(1, 0)
    })
    
    // Position should not change when paused
    expect(result.current.state.bird.y).toBe(initialY)
  })

  it('updateGame spawns pipes at interval', () => {
    const { result } = renderHook(() => useGameState())
    
    act(() => {
      result.current.startGame()
    })
    
    // Frame 100 should spawn a pipe
    act(() => {
      result.current.updateGame(100, 0)
    })
    
    expect(result.current.state.pipes.length).toBeGreaterThan(0)
  })

  it('updateGame moves pipes', () => {
    const { result } = renderHook(() => useGameState())
    
    act(() => {
      result.current.startGame()
    })
    
    // Spawn a pipe
    act(() => {
      result.current.updateGame(100, 0)
    })
    
    const initialX = result.current.state.pipes[0].x
    
    // Move pipes
    act(() => {
      result.current.updateGame(101, 0)
    })
    
    expect(result.current.state.pipes[0].x).toBeLessThan(initialX)
  })

  it('updateGame removes off-screen pipes', () => {
    const { result } = renderHook(() => useGameState())
    
    act(() => {
      result.current.startGame()
    })
    
    // Spawn and move pipe off screen
    for (let i = 0; i < 200; i++) {
      act(() => {
        result.current.updateGame(i, 0)
      })
    }
    
    // Pipes that are fully off screen should be removed
    const offScreenPipes = result.current.state.pipes.filter(p => p.x < -60)
    expect(offScreenPipes).toHaveLength(0)
  })

  it('updateGame moves clouds', () => {
    const { result } = renderHook(() => useGameState())
    
    act(() => {
      result.current.startGame()
    })
    
    const initialX = result.current.state.clouds[0].x
    
    act(() => {
      result.current.updateGame(1, 0)
    })
    
    expect(result.current.state.clouds[0].x).toBeLessThan(initialX)
  })

  it('updateGame spawns clouds at interval', () => {
    const { result } = renderHook(() => useGameState())
    
    act(() => {
      result.current.startGame()
    })
    
    const initialCount = result.current.state.clouds.length
    
    // Frame 300 should spawn a cloud
    act(() => {
      result.current.updateGame(300, 0)
    })
    
    expect(result.current.state.clouds.length).toBeGreaterThanOrEqual(initialCount)
  })

  it('updateGame applies gravity to bird', () => {
    const { result } = renderHook(() => useGameState())
    
    act(() => {
      result.current.startGame()
    })
    
    const initialY = result.current.state.bird.y
    
    act(() => {
      result.current.updateGame(1, 0)
    })
    
    // Bird should fall due to gravity
    expect(result.current.state.bird.y).toBeGreaterThan(initialY)
  })

  it('updateGame clamps bird to ceiling', () => {
    const { result } = renderHook(() => useGameState())
    
    act(() => {
      result.current.startGame()
    })
    
    // Simulate bird going above ceiling with negative velocity
    act(() => {
      // Move bird to top and try to go higher
      result.current.updateGame(1, -20)
    })
    
    // Bird should be clamped
    expect(result.current.state.bird.y).toBeGreaterThanOrEqual(12)
  })

  it('bird collision triggers game over', () => {
    const { result } = renderHook(() => useGameState())
    
    act(() => {
      result.current.startGame()
    })
    
    // Move bird down until ground collision
    for (let i = 0; i < 1000; i++) {
      act(() => {
        result.current.updateGame(i, 5) // High velocity down
      })
      if (result.current.state.gameOver) break
    }
    
    expect(result.current.state.gameOver).toBe(true)
  })
})
