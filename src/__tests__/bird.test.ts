import { describe, it, expect, beforeEach } from 'vitest'
import { Bird, BIRD_SIZE, GRAVITY, JUMP_IMPULSE, MIN_ROTATION, MAX_ROTATION } from '../bird'

describe('Bird', () => {
  let bird: Bird

  beforeEach(() => {
    bird = new Bird({ initialY: 300 })
  })

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      const state = bird.getState()
      expect(state.y).toBe(300)
      expect(state.velocity).toBe(0)
      expect(state.rotation).toBe(0)
    })

    it('should have correct bird size', () => {
      expect(bird.getSize()).toBe(34)
      expect(BIRD_SIZE).toBe(34)
    })
  })

  describe('physics - gravity', () => {
    it('should apply gravity constant of 0.25 per frame', () => {
      const initialVelocity = bird.getVelocity()
      bird.update()
      expect(bird.getVelocity()).toBe(initialVelocity + GRAVITY)
      expect(GRAVITY).toBe(0.25)
    })

    it('should accumulate gravity over multiple frames', () => {
      bird.update()
      bird.update()
      bird.update()
      expect(bird.getVelocity()).toBe(0.75) // 0.25 * 3
    })

    it('should update position based on velocity', () => {
      const initialY = bird.getY()
      bird.update()
      expect(bird.getY()).toBe(initialY + bird.getVelocity())
    })
  })

  describe('physics - jump', () => {
    it('should apply jump impulse of -4.5 upward velocity', () => {
      bird.jump()
      expect(bird.getVelocity()).toBe(JUMP_IMPULSE)
      expect(JUMP_IMPULSE).toBe(-4.5)
    })

    it('should override current velocity when jumping', () => {
      bird.update() // velocity = 0.25
      bird.update() // velocity = 0.5
      bird.jump()   // velocity = -4.5
      expect(bird.getVelocity()).toBe(-4.5)
    })
  })

  describe('physics - terminal velocity', () => {
    it('should cap velocity at terminal velocity', () => {
      // Simulate many updates to build up velocity
      for (let i = 0; i < 100; i++) {
        bird.update()
      }
      expect(bird.getVelocity()).toBeLessThanOrEqual(10)
      expect(bird.getVelocity()).toBe(10)
    })
  })

  describe('rotation', () => {
    it('should calculate rotation based on velocity', () => {
      bird.setVelocity(0)
      expect(bird.getRotation()).toBe(0)
    })

    it('should have minimum rotation of -25 degrees when going up', () => {
      bird.setVelocity(-10)
      expect(bird.getRotation()).toBeGreaterThanOrEqual(-25)
      expect(bird.getRotation()).toBe(MIN_ROTATION)
    })

    it('should have maximum rotation of 90 degrees when falling', () => {
      bird.setVelocity(100)
      expect(bird.getRotation()).toBeLessThanOrEqual(90)
      expect(bird.getRotation()).toBe(MAX_ROTATION)
    })

    it('should tilt upward (negative rotation) when jumping', () => {
      bird.jump()
      expect(bird.getRotation()).toBeLessThan(0)
    })

    it('should tilt downward (positive rotation) when falling', () => {
      bird.setVelocity(5)
      expect(bird.getRotation()).toBeGreaterThan(0)
    })
  })

  describe('reset', () => {
    it('should reset to initial position', () => {
      bird.update()
      bird.update()
      bird.jump()
      bird.reset(300)
      
      const state = bird.getState()
      expect(state.y).toBe(300)
      expect(state.velocity).toBe(0)
      expect(state.rotation).toBe(0)
    })
  })

  describe('state management', () => {
    it('should return correct state object', () => {
      const state = bird.getState()
      expect(state).toHaveProperty('y')
      expect(state).toHaveProperty('velocity')
      expect(state).toHaveProperty('rotation')
    })

    it('should allow setting position directly', () => {
      bird.setPosition(500)
      expect(bird.getY()).toBe(500)
    })

    it('should allow setting velocity directly', () => {
      bird.setVelocity(3)
      expect(bird.getVelocity()).toBe(3)
    })
  })
})
