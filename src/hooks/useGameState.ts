import { useState, useCallback } from 'react'
import type { Bird, Pipe } from '../collisionSystem'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GROUND_Y,
  BIRD_SIZE,
  createBird,
  createPipe,
  shouldTriggerGameOver,
  checkCeilingCollision,
  clampToCeiling,
  PIPE_GAP,
} from '../collisionSystem'

export interface Cloud {
  x: number
  y: number
  size: number
  opacity: number
}

export interface GameState {
  bird: Bird
  pipes: Pipe[]
  clouds: Cloud[]
  score: number
  highScore: number
  gameOver: boolean
  gameStarted: boolean
  gamePaused: boolean
}

// Game constants
const GRAVITY = 0.5
const JUMP_STRENGTH = -8
const PIPE_SPEED = 3
const CLOUD_SPEED = 0.5
const PIPE_SPAWN_INTERVAL = 100
const CLOUD_SPAWN_INTERVAL = 300

function createCloud(x?: number): Cloud {
  return {
    x: x ?? Math.random() * GAME_WIDTH,
    y: 30 + Math.random() * 150,
    size: 30 + Math.random() * 40,
    opacity: 0.3,
  }
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('flappyHighScore')
    return {
      bird: createBird(GAME_HEIGHT / 2),
      pipes: [],
      clouds: [createCloud(50), createCloud(150), createCloud(280)],
      score: 0,
      highScore: saved ? parseInt(saved, 10) : 0,
      gameOver: false,
      gameStarted: false,
      gamePaused: false,
    }
  })

  const resetGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      bird: createBird(GAME_HEIGHT / 2),
      pipes: [],
      score: 0,
      gameOver: false,
      gameStarted: true,
      gamePaused: false,
    }))
  }, [])

  const startGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      gameStarted: true,
    }))
  }, [])

  const pauseGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      gamePaused: true,
    }))
  }, [])

  const resumeGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      gamePaused: false,
    }))
  }, [])

  const jump = useCallback(() => {
    if (state.gameOver) {
      resetGame()
      return
    }
    if (!state.gameStarted) {
      startGame()
    }
    setState(prev => ({
      ...prev,
      bird: {
        ...prev.bird,
        y: prev.bird.y - 5, // Small offset for immediate feedback
      },
    }))
    // Apply jump velocity in next frame via game loop
    return JUMP_STRENGTH
  }, [state.gameOver, state.gameStarted, resetGame, startGame])

  const updateGame = useCallback((frameCount: number, currentVelocity: number): number => {
    let updatedVelocity = currentVelocity
    
    setState(prev => {
      if (prev.gameOver || prev.gamePaused || !prev.gameStarted) {
        return prev
      }

      const newState = { ...prev }
      let newVelocity = currentVelocity

      // Apply gravity
      newVelocity += GRAVITY
      let newY = newState.bird.y + newVelocity

      // Handle ceiling collision (clamp, don't die)
      const tempBird = { ...newState.bird, y: newY }
      if (checkCeilingCollision(tempBird)) {
        newY = clampToCeiling(newState.bird)
        newVelocity = 0
      }

      // Update bird position
      newState.bird = { ...newState.bird, y: newY }

      // Generate pipes
      if (frameCount % PIPE_SPAWN_INTERVAL === 0) {
        const minHeight = 50
        const maxHeight = GROUND_Y - PIPE_GAP - minHeight
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight) + minHeight)
        newState.pipes = [...newState.pipes, createPipe(GAME_WIDTH, topHeight)]
      }

      // Move pipes
      newState.pipes = newState.pipes
        .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
        .filter(pipe => pipe.x + pipe.width > 0)

      // Move clouds
      newState.clouds = newState.clouds
        .map(cloud => ({ ...cloud, x: cloud.x - CLOUD_SPEED }))
        .filter(cloud => cloud.x + cloud.size > 0)

      // Add new cloud occasionally
      if (frameCount % CLOUD_SPAWN_INTERVAL === 0) {
        newState.clouds = [...newState.clouds, createCloud(GAME_WIDTH + 50)]
      }

      // Check score - count passed pipes
      for (const pipe of newState.pipes) {
        const birdLeft = newState.bird.x - BIRD_SIZE / 2
        if (!pipe.passed && pipe.x + pipe.width < birdLeft) {
          pipe.passed = true
          newState.score++
          if (newState.score > newState.highScore) {
            newState.highScore = newState.score
            localStorage.setItem('flappyHighScore', newState.highScore.toString())
          }
        }
      }

      // Check collisions using the collision system
      if (shouldTriggerGameOver(newState.bird, newState.pipes)) {
        newState.gameOver = true
      }

      updatedVelocity = newVelocity
      return newState
    })
    
    return updatedVelocity
  }, [])

  return {
    state,
    resetGame,
    startGame,
    pauseGame,
    resumeGame,
    jump,
    updateGame,
  }
}
