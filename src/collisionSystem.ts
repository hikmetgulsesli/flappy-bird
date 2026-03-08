// Collision detection system for Flappy Bird
// Uses AABB (Axis-Aligned Bounding Box) collision detection

export const GAME_WIDTH = 400
export const GAME_HEIGHT = 600
export const BIRD_SIZE = 24
export const PIPE_WIDTH = 52
export const PIPE_GAP = 140
export const GROUND_HEIGHT = 50
export const CEILING_Y = 0

// Ground Y position (where collision occurs)
export const GROUND_Y = GAME_HEIGHT - GROUND_HEIGHT

export interface Bird {
  x: number
  y: number
  width: number
  height: number
}

export interface Pipe {
  x: number
  topHeight: number
  width: number
  gap: number
}

export interface CollisionResult {
  hasCollision: boolean
  collisionType: 'pipe' | 'ground' | 'ceiling' | null
}

/**
 * Create a bird object at default position
 */
export function createBird(y: number = GAME_HEIGHT / 2): Bird {
  return {
    x: GAME_WIDTH / 2,
    y,
    width: BIRD_SIZE,
    height: BIRD_SIZE,
  }
}

/**
 * Create a pipe at specified position
 */
export function createPipe(x: number, topHeight: number): Pipe {
  return {
    x,
    topHeight,
    width: PIPE_WIDTH,
    gap: PIPE_GAP,
  }
}

/**
 * Get bird bounding box (AABB)
 */
export function getBirdBounds(bird: Bird): { left: number; right: number; top: number; bottom: number } {
  const halfWidth = bird.width / 2
  const halfHeight = bird.height / 2
  return {
    left: bird.x - halfWidth,
    right: bird.x + halfWidth,
    top: bird.y - halfHeight,
    bottom: bird.y + halfHeight,
  }
}

/**
 * Get top pipe bounding box
 */
export function getTopPipeBounds(pipe: Pipe): { left: number; right: number; top: number; bottom: number } {
  return {
    left: pipe.x,
    right: pipe.x + pipe.width,
    top: 0,
    bottom: pipe.topHeight,
  }
}

/**
 * Get bottom pipe bounding box
 */
export function getBottomPipeBounds(pipe: Pipe): { left: number; right: number; top: number; bottom: number } {
  return {
    left: pipe.x,
    right: pipe.x + pipe.width,
    top: pipe.topHeight + pipe.gap,
    bottom: GAME_HEIGHT,
  }
}

/**
 * Check AABB collision between two bounding boxes
 */
export function checkAABBCollision(
  a: { left: number; right: number; top: number; bottom: number },
  b: { left: number; right: number; top: number; bottom: number }
): boolean {
  return (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
  )
}

/**
 * Check if bird collides with top pipe
 * Bird collides with top pipe if bird.top < pipe.top.bottom
 */
export function checkTopPipeCollision(bird: Bird, pipe: Pipe): boolean {
  const birdBounds = getBirdBounds(bird)
  const pipeBounds = getTopPipeBounds(pipe)

  // Only check if bird is horizontally within pipe range
  if (birdBounds.right <= pipeBounds.left || birdBounds.left >= pipeBounds.right) {
    return false
  }

  // Bird collides with top pipe if bird's top is above pipe's bottom
  return birdBounds.top < pipeBounds.bottom
}

/**
 * Check if bird collides with bottom pipe
 * Bird collides with bottom pipe if bird.bottom > pipe.bottom.top
 */
export function checkBottomPipeCollision(bird: Bird, pipe: Pipe): boolean {
  const birdBounds = getBirdBounds(bird)
  const pipeBounds = getBottomPipeBounds(pipe)

  // Only check if bird is horizontally within pipe range
  if (birdBounds.right <= pipeBounds.left || birdBounds.left >= pipeBounds.right) {
    return false
  }

  // Bird collides with bottom pipe if bird's bottom is below pipe's top
  return birdBounds.bottom > pipeBounds.top
}

/**
 * Check if bird collides with any pipe (top or bottom)
 */
export function checkPipeCollision(bird: Bird, pipes: Pipe[]): boolean {
  for (const pipe of pipes) {
    if (checkTopPipeCollision(bird, pipe) || checkBottomPipeCollision(bird, pipe)) {
      return true
    }
  }
  return false
}

/**
 * Check if bird hits the ground
 * Ground collision occurs when bird.bottom >= GROUND_Y (400)
 */
export function checkGroundCollision(bird: Bird): boolean {
  const birdBounds = getBirdBounds(bird)
  return birdBounds.bottom >= GROUND_Y
}

/**
 * Check if bird hits the ceiling
 * Ceiling collision occurs when bird.top <= CEILING_Y (0)
 * Note: Ceiling collision clamps but is NOT lethal
 */
export function checkCeilingCollision(bird: Bird): boolean {
  const birdBounds = getBirdBounds(bird)
  return birdBounds.top <= CEILING_Y
}

/**
 * Clamp bird to ceiling (returns clamped y position)
 */
export function clampToCeiling(bird: Bird): number {
  return bird.height / 2 // Bird center should be at half height when at ceiling
}

/**
 * Main collision detection function
 * Returns collision result with type
 */
export function detectCollisions(bird: Bird, pipes: Pipe[]): CollisionResult {
  // Check pipe collisions first
  if (checkPipeCollision(bird, pipes)) {
    return { hasCollision: true, collisionType: 'pipe' }
  }

  // Check ground collision
  if (checkGroundCollision(bird)) {
    return { hasCollision: true, collisionType: 'ground' }
  }

  // Check ceiling collision (non-lethal, just for clamping)
  if (checkCeilingCollision(bird)) {
    return { hasCollision: false, collisionType: 'ceiling' }
  }

  return { hasCollision: false, collisionType: null }
}

/**
 * Check if game should end due to collision
 * Ceiling collision does NOT trigger game over
 */
export function shouldTriggerGameOver(bird: Bird, pipes: Pipe[]): boolean {
  const result = detectCollisions(bird, pipes)
  return result.hasCollision && result.collisionType !== 'ceiling'
}
