import { describe, it, expect } from 'vitest'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PIPE_WIDTH,
  PIPE_GAP,
  PIPE_SPEED,
  PIPE_SPAWN_FRAMES,
  MIN_PIPE_HEIGHT,
  generatePipe,
  updatePipes,
  shouldSpawnPipe,
  validatePipe,
  type Pipe,
} from './pipeSystem'

describe('Pipe System Constants', () => {
  it('should have correct pipe width (52px)', () => {
    expect(PIPE_WIDTH).toBe(52)
  })

  it('should have correct pipe gap (160px)', () => {
    expect(PIPE_GAP).toBe(160)
  })

  it('should have correct pipe speed (2px/frame)', () => {
    expect(PIPE_SPEED).toBe(2)
  })

  it('should spawn pipes every 150 frames', () => {
    expect(PIPE_SPAWN_FRAMES).toBe(150)
  })

  it('should have minimum pipe height of 50px', () => {
    expect(MIN_PIPE_HEIGHT).toBe(50)
  })
})

describe('generatePipe', () => {
  it('should generate pipe at game width position', () => {
    const pipe = generatePipe()
    expect(pipe.x).toBe(GAME_WIDTH)
  })

  it('should generate pipe with passed set to false', () => {
    const pipe = generatePipe()
    expect(pipe.passed).toBe(false)
  })

  it('should generate pipe with top height >= MIN_PIPE_HEIGHT', () => {
    const pipe = generatePipe()
    expect(pipe.topHeight).toBeGreaterThanOrEqual(MIN_PIPE_HEIGHT)
  })

  it('should generate pipe with top height that leaves room for gap and min bottom pipe', () => {
    const pipe = generatePipe()
    const maxHeight = GAME_HEIGHT - PIPE_GAP - MIN_PIPE_HEIGHT
    expect(pipe.topHeight).toBeLessThanOrEqual(maxHeight)
  })

  it('should generate different heights on multiple calls (randomized)', () => {
    const heights: number[] = []
    for (let i = 0; i < 10; i++) {
      heights.push(generatePipe().topHeight)
    }
    // Check that we have some variation (not all the same)
    const uniqueHeights = new Set(heights)
    expect(uniqueHeights.size).toBeGreaterThan(1)
  })
})

describe('updatePipes', () => {
  it('should move pipes left by PIPE_SPEED', () => {
    const pipes: Pipe[] = [{ x: 100, topHeight: 100, passed: false }]
    const updated = updatePipes(pipes)
    expect(updated[0].x).toBe(100 - PIPE_SPEED)
  })

  it('should remove pipes that are off-screen (x <= -PIPE_WIDTH)', () => {
    // Pipes start at positions, then move left by PIPE_SPEED
    // A pipe is kept if after moving, x > -PIPE_WIDTH
    const pipes: Pipe[] = [
      { x: -PIPE_WIDTH - 1, topHeight: 100, passed: false },  // After: -53, off-screen, remove
      { x: -PIPE_WIDTH, topHeight: 100, passed: false },       // After: -54, off-screen, remove
      { x: -PIPE_WIDTH + 3, topHeight: 100, passed: false },   // After: -51, still visible (x > -52), keep
    ]
    const updated = updatePipes(pipes)
    expect(updated.length).toBe(1)
    expect(updated[0].x).toBe(-PIPE_WIDTH + 3 - PIPE_SPEED)
  })

  it('should keep pipes that are still visible', () => {
    const pipes: Pipe[] = [
      { x: 0, topHeight: 100, passed: false },
      { x: 50, topHeight: 100, passed: false },
      { x: 100, topHeight: 100, passed: false },
    ]
    const updated = updatePipes(pipes)
    expect(updated.length).toBe(3)
  })

  it('should preserve other pipe properties', () => {
    const pipes: Pipe[] = [{ x: 100, topHeight: 150, passed: true }]
    const updated = updatePipes(pipes)
    expect(updated[0].topHeight).toBe(150)
    expect(updated[0].passed).toBe(true)
  })
})

describe('shouldSpawnPipe', () => {
  it('should return true every 150 frames', () => {
    expect(shouldSpawnPipe(150)).toBe(true)
    expect(shouldSpawnPipe(300)).toBe(true)
    expect(shouldSpawnPipe(450)).toBe(true)
  })

  it('should return false on other frames', () => {
    expect(shouldSpawnPipe(0)).toBe(true) // 0 % 150 === 0
    expect(shouldSpawnPipe(1)).toBe(false)
    expect(shouldSpawnPipe(149)).toBe(false)
    expect(shouldSpawnPipe(151)).toBe(false)
  })
})

describe('validatePipe', () => {
  it('should validate correct pipe', () => {
    const pipe = generatePipe()
    expect(validatePipe(pipe)).toBe(true)
  })

  it('should reject pipe with top height below minimum', () => {
    const pipe: Pipe = { x: GAME_WIDTH, topHeight: MIN_PIPE_HEIGHT - 1, passed: false }
    expect(validatePipe(pipe)).toBe(false)
  })

  it('should reject pipe with top height too large', () => {
    const maxHeight = GAME_HEIGHT - PIPE_GAP - MIN_PIPE_HEIGHT
    const pipe: Pipe = { x: GAME_WIDTH, topHeight: maxHeight + 1, passed: false }
    expect(validatePipe(pipe)).toBe(false)
  })

  it('should reject pipe not at game width', () => {
    const pipe: Pipe = { x: GAME_WIDTH - 1, topHeight: 100, passed: false }
    expect(validatePipe(pipe)).toBe(false)
  })
})
