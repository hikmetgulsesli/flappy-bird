import { describe, it, expect, beforeEach } from 'vitest'
import '../../stitch/design-tokens.css'

// Test design tokens and color palette

describe('Design Tokens', () => {
  beforeEach(() => {
    // Reset document styles before each test
    document.documentElement.style.cssText = ''
  })

  describe('CSS Custom Properties', () => {
    it('should define all required color CSS variables', () => {
      // Check that design-tokens.css has been loaded
      const styles = getComputedStyle(document.documentElement)
      
      // Sky colors
      expect(styles.getPropertyValue('--color-sky-cyan').trim()).toBe('#4EC0CA')
      expect(styles.getPropertyValue('--color-sky-gradient').trim()).toBe('#70c5ce')
      expect(styles.getPropertyValue('--color-sky-light').trim()).toBe('#a8e6cf')
      
      // Bird colors
      expect(styles.getPropertyValue('--color-bird-yellow').trim()).toBe('#F4D03F')
      expect(styles.getPropertyValue('--color-bird-dark').trim()).toBe('#d4ac0d')
      expect(styles.getPropertyValue('--color-bird-beak').trim()).toBe('#E67E22')
      
      // Pipe colors
      expect(styles.getPropertyValue('--color-pipe-green').trim()).toBe('#73BF2E')
      expect(styles.getPropertyValue('--color-pipe-green-dark').trim()).toBe('#558B2F')
      
      // Ground colors
      expect(styles.getPropertyValue('--color-sand-ground').trim()).toBe('#DED895')
      expect(styles.getPropertyValue('--color-sand-dark').trim()).toBe('#d4c76a')
    })

    it('should define typography variables', () => {
      const styles = getComputedStyle(document.documentElement)
      
      const fontFamily = styles.getPropertyValue('--font-mono').trim()
      expect(fontFamily).toContain('Courier New')
    })

    it('should define pixel art variables', () => {
      const styles = getComputedStyle(document.documentElement)
      
      expect(styles.getPropertyValue('--pixel-size').trim()).toBe('4px')
      expect(styles.getPropertyValue('--image-rendering').trim()).toBe('pixelated')
    })
  })

  describe('Color Palette Values', () => {
    it('should have correct sky cyan color', () => {
      const cyan = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-sky-cyan')
        .trim()
      expect(cyan.toLowerCase()).toBe('#4ec0ca')
    })

    it('should have correct bird yellow color', () => {
      const yellow = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-bird-yellow')
        .trim()
      expect(yellow.toUpperCase()).toBe('#F4D03F')
    })

    it('should have correct pipe green colors', () => {
      const green = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-pipe-green')
        .trim()
      const greenDark = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-pipe-green-dark')
        .trim()
      expect(green.toUpperCase()).toBe('#73BF2E')
      expect(greenDark.toUpperCase()).toBe('#558B2F')
    })

    it('should have correct sand ground color', () => {
      const sand = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-sand-ground')
        .trim()
      expect(sand.toUpperCase()).toBe('#DED895')
    })

    it('should have correct orange beak color', () => {
      const beak = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-bird-beak')
        .trim()
      expect(beak.toUpperCase()).toBe('#E67E22')
    })
  })
})

describe('Canvas Rendering', () => {
  it('should apply pixelated rendering to canvas', () => {
    const canvas = document.createElement('canvas')
    canvas.className = 'image-pixelated'
    document.body.appendChild(canvas)
    
    // Verify canvas has the pixelated class
    expect(canvas.classList.contains('image-pixelated')).toBe(true)
    
    // Verify CSS variable for image rendering is defined
    const styles = getComputedStyle(document.documentElement)
    expect(styles.getPropertyValue('--image-rendering').trim()).toBe('pixelated')
    
    document.body.removeChild(canvas)
  })
})
