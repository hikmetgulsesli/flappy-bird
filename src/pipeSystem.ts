// Pipe system constants and utilities for Flappy Bird game
// Classic Flappy Bird dimensions (288x512)
export const GAME_WIDTH = 288
export const GAME_HEIGHT = 512
export const PIPE_WIDTH = 52
export const PIPE_GAP = 160
export const PIPE_SPEED = 2
export const PIPE_SPAWN_FRAMES = 150
export const MIN_PIPE_HEIGHT = 50

export interface Pipe {
  x: number
  topHeight: number
  passed: boolean
}

/**
 * Generates a new pipe with randomized top height
 * @returns A new pipe object positioned at the right edge of the game
 */
export function generatePipe(): Pipe {
  const maxHeight = GAME_HEIGHT - PIPE_GAP - MIN_PIPE_HEIGHT
  const topHeight = Math.floor(Math.random() * (maxHeight - MIN_PIPE_HEIGHT) + MIN_PIPE_HEIGHT)
  return {
    x: GAME_WIDTH,
    topHeight,
    passed: false,
  }
}

/**
 * Updates pipe positions and filters out off-screen pipes
 * Pipes are removed when x <= -PIPE_WIDTH (completely off-screen)
 * @param pipes - Array of current pipes
 * @returns Updated array with moved pipes, off-screen pipes removed
 */
export function updatePipes(pipes: Pipe[]): Pipe[] {
  return pipes
    .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
    .filter(pipe => pipe.x > -PIPE_WIDTH)
}

/**
 * Checks if it's time to spawn a new pipe based on frame count
 * @param frameCount - Current frame count
 * @returns true if a new pipe should be spawned
 */
export function shouldSpawnPipe(frameCount: number): boolean {
  return frameCount % PIPE_SPAWN_FRAMES === 0
}

/**
 * Validates pipe dimensions against requirements
 * @param pipe - Pipe to validate
 * @returns true if pipe meets all specifications
 */
export function validatePipe(pipe: Pipe): boolean {
  // Pipe width must be exactly 52px
  // This is implicit in the render logic

  // Top pipe height must be at least MIN_PIPE_HEIGHT
  if (pipe.topHeight < MIN_PIPE_HEIGHT) return false

  // Must leave room for gap and minimum bottom pipe
  const maxHeight = GAME_HEIGHT - PIPE_GAP - MIN_PIPE_HEIGHT
  if (pipe.topHeight > maxHeight) return false

  // Pipe must start at game width
  if (pipe.x !== GAME_WIDTH) return false

  return true
}
