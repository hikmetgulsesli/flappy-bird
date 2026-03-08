import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock CSS imports
Object.defineProperty(window, 'getComputedStyle', {
  value: () => {
    const styles: Record<string, string> = {
      '--color-sky-cyan': '#4EC0CA',
      '--color-sky-gradient': '#70c5ce',
      '--color-sky-light': '#a8e6cf',
      '--color-bird-yellow': '#F4D03F',
      '--color-bird-dark': '#d4ac0d',
      '--color-bird-eye': '#ffffff',
      '--color-bird-pupil': '#000000',
      '--color-bird-beak': '#E67E22',
      '--color-pipe-green': '#73BF2E',
      '--color-pipe-green-dark': '#558B2F',
      '--color-pipe-light': '#a0de6e',
      '--color-pipe-dark': '#5a9a1e',
      '--color-pipe-border': '#2d5016',
      '--color-sand-ground': '#DED895',
      '--color-sand-dark': '#d4c76a',
      '--color-ground-border': '#5a7d2a',
      '--color-text-primary': '#ffffff',
      '--color-text-dark': '#000000',
      '--color-gold': '#ffd700',
      '--color-particle-1': '#ff6b6b',
      '--color-particle-2': '#F4D03F',
      '--color-particle-3': '#E67E22',
      '--color-particle-4': '#d4ac0d',
      '--font-mono': '"Courier New", "Lucida Console", Monaco, monospace',
      '--pixel-size': '4px',
      '--image-rendering': 'pixelated',
    }
    
    return {
      getPropertyValue: (prop: string) => styles[prop] || '',
    }
  },
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})
