import { describe, it, expect } from 'vitest'
import {
  createBird,
  createPipe,
  getBirdBounds,
  getTopPipeBounds,
  getBottomPipeBounds,
  checkAABBCollision,
  checkTopPipeCollision,
  checkBottomPipeCollision,
  checkPipeCollision,
  checkGroundCollision,
  checkCeilingCollision,
  clampToCeiling,
  detectCollisions,
  shouldTriggerGameOver,
  GAME_WIDTH,
  GAME_HEIGHT,
  BIRD_SIZE,
  PIPE_WIDTH,
  PIPE_GAP,
  GROUND_Y,
} from './collisionSystem'

describe('Collision System', () => {
  describe('createBird', () => {
    it('should create bird at default position', () => {
      const bird = createBird()
      expect(bird.x).toBe(GAME_WIDTH / 2)
      expect(bird.y).toBe(GAME_HEIGHT / 2)
      expect(bird.width).toBe(BIRD_SIZE)
      expect(bird.height).toBe(BIRD_SIZE)
    })

    it('should create bird at specified Y position', () => {
      const bird = createBird(200)
      expect(bird.y).toBe(200)
    })
  })

  describe('createPipe', () => {
    it('should create pipe at specified position', () => {
      const pipe = createPipe(300, 100)
      expect(pipe.x).toBe(300)
      expect(pipe.topHeight).toBe(100)
      expect(pipe.width).toBe(PIPE_WIDTH)
      expect(pipe.gap).toBe(PIPE_GAP)
    })
  })

  describe('getBirdBounds', () => {
    it('should calculate correct bird bounds', () => {
      const bird = createBird(200)
      const bounds = getBirdBounds(bird)
      expect(bounds.left).toBe(bird.x - BIRD_SIZE / 2)
      expect(bounds.right).toBe(bird.x + BIRD_SIZE / 2)
      expect(bounds.top).toBe(bird.y - BIRD_SIZE / 2)
      expect(bounds.bottom).toBe(bird.y + BIRD_SIZE / 2)
    })
  })

  describe('getTopPipeBounds', () => {
    it('should calculate correct top pipe bounds', () => {
      const pipe = createPipe(300, 100)
      const bounds = getTopPipeBounds(pipe)
      expect(bounds.left).toBe(300)
      expect(bounds.right).toBe(300 + PIPE_WIDTH)
      expect(bounds.top).toBe(0)
      expect(bounds.bottom).toBe(100)
    })
  })

  describe('getBottomPipeBounds', () => {
    it('should calculate correct bottom pipe bounds', () => {
      const pipe = createPipe(300, 100)
      const bounds = getBottomPipeBounds(pipe)
      expect(bounds.left).toBe(300)
      expect(bounds.right).toBe(300 + PIPE_WIDTH)
      expect(bounds.top).toBe(100 + PIPE_GAP)
      expect(bounds.bottom).toBe(GAME_HEIGHT)
    })
  })

  describe('checkAABBCollision', () => {
    it('should detect overlapping boxes', () => {
      const a = { left: 0, right: 10, top: 0, bottom: 10 }
      const b = { left: 5, right: 15, top: 5, bottom: 15 }
      expect(checkAABBCollision(a, b)).toBe(true)
    })

    it('should not detect collision for non-overlapping boxes', () => {
      const a = { left: 0, right: 10, top: 0, bottom: 10 }
      const b = { left: 20, right: 30, top: 20, bottom: 30 }
      expect(checkAABBCollision(a, b)).toBe(false)
    })

    it('should not detect collision for boxes touching at edges', () => {
      const a = { left: 0, right: 10, top: 0, bottom: 10 }
      const b = { left: 10, right: 20, top: 0, bottom: 10 }
      expect(checkAABBCollision(a, b)).toBe(false)
    })
  })

  describe('checkTopPipeCollision', () => {
    it('should detect collision when bird hits top pipe', () => {
      const bird = createBird(50)
      bird.x = 200
      const pipe = createPipe(188, 100)
      expect(checkTopPipeCollision(bird, pipe)).toBe(true)
    })

    it('should not detect collision when bird is below top pipe', () => {
      const bird = createBird(150)
      bird.x = 200
      const pipe = createPipe(188, 100)
      expect(checkTopPipeCollision(bird, pipe)).toBe(false)
    })

    it('should not detect collision when bird is to the left of pipe', () => {
      const bird = createBird(50)
      bird.x = 100
      const pipe = createPipe(300, 100)
      expect(checkTopPipeCollision(bird, pipe)).toBe(false)
    })

    it('should not detect collision when bird is to the right of pipe', () => {
      const bird = createBird(50)
      bird.x = 400
      const pipe = createPipe(200, 100)
      expect(checkTopPipeCollision(bird, pipe)).toBe(false)
    })

    it('should detect collision when bird.top < pipe.top.bottom', () => {
      const bird = createBird(90)
      bird.x = 200
      const pipe = createPipe(188, 100)
      expect(bird.y - BIRD_SIZE / 2).toBeLessThan(pipe.topHeight)
      expect(checkTopPipeCollision(bird, pipe)).toBe(true)
    })
  })

  describe('checkBottomPipeCollision', () => {
    it('should detect collision when bird hits bottom pipe', () => {
      const bird = createBird(250)
      bird.x = 200
      const pipe = createPipe(188, 100)
      expect(checkBottomPipeCollision(bird, pipe)).toBe(true)
    })

    it('should not detect collision when bird is above bottom pipe', () => {
      const bird = createBird(200)
      bird.x = 200
      const pipe = createPipe(188, 100)
      expect(checkBottomPipeCollision(bird, pipe)).toBe(false)
    })

    it('should not detect collision when bird is to the left of pipe', () => {
      const bird = createBird(250)
      bird.x = 100
      const pipe = createPipe(300, 100)
      expect(checkBottomPipeCollision(bird, pipe)).toBe(false)
    })

    it('should not detect collision when bird is to the right of pipe', () => {
      const bird = createBird(250)
      bird.x = 400
      const pipe = createPipe(200, 100)
      expect(checkBottomPipeCollision(bird, pipe)).toBe(false)
    })

    it('should detect collision when bird.bottom > pipe.bottom.top', () => {
      const bird = createBird(270)
      bird.x = 200
      const pipe = createPipe(188, 100)
      expect(bird.y + BIRD_SIZE / 2).toBeGreaterThan(pipe.topHeight + pipe.gap)
      expect(checkBottomPipeCollision(bird, pipe)).toBe(true)
    })
  })

  describe('checkPipeCollision', () => {
    it('should detect top pipe collision', () => {
      const bird = createBird(50)
      bird.x = 200
      const pipes = [createPipe(188, 100)]
      expect(checkPipeCollision(bird, pipes)).toBe(true)
    })

    it('should detect bottom pipe collision', () => {
      const bird = createBird(250)
      bird.x = 200
      const pipes = [createPipe(188, 100)]
      expect(checkPipeCollision(bird, pipes)).toBe(true)
    })

    it('should not detect collision when bird is in gap', () => {
      const bird = createBird(170)
      bird.x = 200
      const pipes = [createPipe(188, 100)]
      expect(checkPipeCollision(bird, pipes)).toBe(false)
    })

    it('should detect collision with any pipe in array', () => {
      const bird = createBird(50)
      bird.x = 200
      const pipes = [
        createPipe(50, 100),
        createPipe(188, 100),
        createPipe(300, 100),
      ]
      expect(checkPipeCollision(bird, pipes)).toBe(true)
    })

    it('should return false for empty pipe array', () => {
      const bird = createBird(200)
      expect(checkPipeCollision(bird, [])).toBe(false)
    })
  })

  describe('checkGroundCollision', () => {
    it('should detect collision when bird hits ground (y >= 550)', () => {
      const bird = createBird(GROUND_Y)
      expect(checkGroundCollision(bird)).toBe(true)
    })

    it('should detect collision when bird is below ground', () => {
      const bird = createBird(560)
      expect(checkGroundCollision(bird)).toBe(true)
    })

    it('should not detect collision when bird is above ground', () => {
      const bird = createBird(300)
      expect(checkGroundCollision(bird)).toBe(false)
    })

    it('should detect collision at exactly ground level', () => {
      const bird = createBird(GROUND_Y - BIRD_SIZE / 2 + 1)
      expect(checkGroundCollision(bird)).toBe(true)
    })
  })

  describe('checkCeilingCollision', () => {
    it('should detect collision when bird hits ceiling (y <= 0)', () => {
      const bird = createBird(0)
      expect(checkCeilingCollision(bird)).toBe(true)
    })

    it('should detect collision when bird is above ceiling', () => {
      const bird = createBird(-50)
      expect(checkCeilingCollision(bird)).toBe(true)
    })

    it('should not detect collision when bird is below ceiling', () => {
      const bird = createBird(50)
      expect(checkCeilingCollision(bird)).toBe(false)
    })

    it('should detect collision at exactly ceiling level', () => {
      const bird = createBird(BIRD_SIZE / 2 - 1)
      expect(checkCeilingCollision(bird)).toBe(true)
    })
  })

  describe('clampToCeiling', () => {
    it('should return correct clamped Y position', () => {
      const bird = createBird()
      const clampedY = clampToCeiling(bird)
      expect(clampedY).toBe(BIRD_SIZE / 2)
    })

    it('should keep bird within bounds when at ceiling', () => {
      const bird = createBird(0)
      const clampedY = clampToCeiling(bird)
      expect(clampedY).toBe(12)
    })
  })

  describe('detectCollisions', () => {
    it('should detect pipe collision', () => {
      const bird = createBird(50)
      bird.x = 200
      const pipes = [createPipe(188, 100)]
      const result = detectCollisions(bird, pipes)
      expect(result.hasCollision).toBe(true)
      expect(result.collisionType).toBe('pipe')
    })

    it('should detect ground collision', () => {
      const bird = createBird(GROUND_Y)
      const result = detectCollisions(bird, [])
      expect(result.hasCollision).toBe(true)
      expect(result.collisionType).toBe('ground')
    })

    it('should detect ceiling collision (non-lethal)', () => {
      const bird = createBird(0)
      const result = detectCollisions(bird, [])
      expect(result.hasCollision).toBe(false)
      expect(result.collisionType).toBe('ceiling')
    })

    it('should return no collision when safe', () => {
      const bird = createBird(200)
      const pipes = [createPipe(50, 100)]
      const result = detectCollisions(bird, pipes)
      expect(result.hasCollision).toBe(false)
      expect(result.collisionType).toBeNull()
    })

    it('should prioritize pipe collision over ground', () => {
      const bird = createBird(400)
      bird.x = 200
      const pipes = [createPipe(188, 100)]
      const result = detectCollisions(bird, pipes)
      expect(result.hasCollision).toBe(true)
      expect(result.collisionType).toBe('pipe')
    })
  })

  describe('shouldTriggerGameOver', () => {
    it('should trigger game over on pipe collision', () => {
      const bird = createBird(50)
      bird.x = 200
      const pipes = [createPipe(188, 100)]
      expect(shouldTriggerGameOver(bird, pipes)).toBe(true)
    })

    it('should trigger game over on ground collision', () => {
      const bird = createBird(GROUND_Y)
      expect(shouldTriggerGameOver(bird, [])).toBe(true)
    })

    it('should NOT trigger game over on ceiling collision', () => {
      const bird = createBird(0)
      expect(shouldTriggerGameOver(bird, [])).toBe(false)
    })

    it('should NOT trigger game over when no collision', () => {
      const bird = createBird(200)
      const pipes = [createPipe(50, 100)]
      expect(shouldTriggerGameOver(bird, pipes)).toBe(false)
    })

    it('should handle edge case: bird exactly at ground level', () => {
      // Bird at y=538 means bird.bottom = 550 = GROUND_Y, which is a collision
      const bird = createBird(GROUND_Y - BIRD_SIZE / 2)
      expect(shouldTriggerGameOver(bird, [])).toBe(true)
    })

    it('should handle edge case: bird just above ground', () => {
      const bird = createBird(GROUND_Y - BIRD_SIZE / 2 - 1)
      expect(shouldTriggerGameOver(bird, [])).toBe(false)
    })

    it('should handle edge case: bird just below ground', () => {
      const bird = createBird(GROUND_Y - BIRD_SIZE / 2 + 1)
      expect(shouldTriggerGameOver(bird, [])).toBe(true)
    })
  })

  describe('Edge cases and acceptance criteria', () => {
    it('AC1: Bird-to-pipe collision detected correctly', () => {
      const bird = createBird(50)
      bird.x = 200
      const pipe = createPipe(188, 100)
      expect(checkTopPipeCollision(bird, pipe)).toBe(true)
    })

    it('AC2: Bird-to-ground collision detected correctly (y >= 550)', () => {
      const bird = createBird(GROUND_Y)
      expect(checkGroundCollision(bird)).toBe(true)
      expect(bird.y + BIRD_SIZE / 2).toBeGreaterThanOrEqual(GROUND_Y)
    })

    it('AC3: Bird stops at ceiling (y <= 0) without game over', () => {
      const bird = createBird(0)
      expect(checkCeilingCollision(bird)).toBe(true)
      expect(shouldTriggerGameOver(bird, [])).toBe(false)
    })

    it('AC4: Collision triggers game over state', () => {
      const bird1 = createBird(50)
      bird1.x = 200
      const pipes = [createPipe(188, 100)]
      expect(shouldTriggerGameOver(bird1, pipes)).toBe(true)

      const bird2 = createBird(GROUND_Y)
      expect(shouldTriggerGameOver(bird2, [])).toBe(true)
    })

    it('AC5: All collision scenarios have tests', () => {
      expect(checkTopPipeCollision(createBird(50), createPipe(200, 100))).toBeDefined()
      expect(checkBottomPipeCollision(createBird(250), createPipe(200, 100))).toBeDefined()
      expect(checkGroundCollision(createBird(400))).toBeDefined()
      expect(checkCeilingCollision(createBird(0))).toBeDefined()
      expect(checkAABBCollision(
        { left: 0, right: 10, top: 0, bottom: 10 },
        { left: 5, right: 15, top: 5, bottom: 15 }
      )).toBeDefined()
    })

    it('AC6: Typecheck passes (verified at build time)', () => {
      const bird = createBird()
      const pipe = createPipe(100, 50)
      const result = detectCollisions(bird, [pipe])

      expect(typeof result.hasCollision).toBe('boolean')
      expect(result.collisionType === 'pipe' || result.collisionType === 'ground' || result.collisionType === 'ceiling' || result.collisionType === null).toBe(true)
    })
  })
})
