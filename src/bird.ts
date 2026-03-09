/**
 * Bird physics and rendering module
 * Implements a 34x34px bird with physics-based movement
 */

export const BIRD_SIZE = 34;
export const GRAVITY = 0.25;
export const JUMP_IMPULSE = -4.5;
export const TERMINAL_VELOCITY = 10;
export const MIN_ROTATION = -25;
export const MAX_ROTATION = 90;

export interface BirdState {
  y: number;
  velocity: number;
  rotation: number;
}

export interface BirdConfig {
  initialY: number;
}

export class Bird {
  private y: number;
  private velocity: number;
  private rotation: number;

  constructor(config: BirdConfig) {
    this.y = config.initialY;
    this.velocity = 0;
    this.rotation = 0;
  }

  /**
   * Apply gravity and update position
   */
  update(): void {
    // Apply gravity
    this.velocity += GRAVITY;
    
    // Cap at terminal velocity
    if (this.velocity > TERMINAL_VELOCITY) {
      this.velocity = TERMINAL_VELOCITY;
    }
    
    // Update position
    this.y += this.velocity;
    
    // Calculate rotation based on velocity
    this.updateRotation();
  }

  /**
   * Calculate rotation angle based on velocity
   * Maps velocity to rotation range: -25° to 90°
   */
  private updateRotation(): void {
    // Map velocity to rotation
    // Negative velocity (going up) = negative rotation (tilt up)
    // Positive velocity (going down) = positive rotation (tilt down)
    const targetRotation = Math.min(MAX_ROTATION, Math.max(MIN_ROTATION, this.velocity * 3));
    this.rotation = targetRotation;
  }

  /**
   * Apply jump impulse
   */
  jump(): void {
    this.velocity = JUMP_IMPULSE;
    this.updateRotation();
  }

  /**
   * Reset bird to initial state
   */
  reset(initialY: number): void {
    this.y = initialY;
    this.velocity = 0;
    this.rotation = 0;
  }

  /**
   * Get current state
   */
  getState(): BirdState {
    return {
      y: this.y,
      velocity: this.velocity,
      rotation: this.rotation,
    };
  }

  /**
   * Get bird Y position
   */
  getY(): number {
    return this.y;
  }

  /**
   * Get bird velocity
   */
  getVelocity(): number {
    return this.velocity;
  }

  /**
   * Get bird rotation in degrees
   */
  getRotation(): number {
    return this.rotation;
  }

  /**
   * Get bird size
   */
  getSize(): number {
    return BIRD_SIZE;
  }

  /**
   * Set position directly (for testing)
   */
  setPosition(y: number): void {
    this.y = y;
  }

  /**
   * Set velocity directly (for testing)
   */
  setVelocity(velocity: number): void {
    this.velocity = velocity;
    this.updateRotation();
  }
}

/**
 * Render bird to canvas context
 * Bird is 34x34px with pixel-art style:
 * - Yellow body (#F4D03F)
 * - White eye with black pupil
 * - Orange beak (#E67E22)
 */
export function renderBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number
): void {
  const size = BIRD_SIZE;
  const halfSize = size / 2;

  ctx.save();
  
  // Move to bird center and rotate
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  
  // Draw bird body (yellow rectangle with rounded corners)
  ctx.fillStyle = '#F4D03F';
  ctx.beginPath();
  ctx.roundRect(-halfSize + 2, -halfSize + 2, size - 4, size - 4, 4);
  ctx.fill();
  
  // Draw body outline for pixel-art effect
  ctx.strokeStyle = '#D4AC0D';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw wing (darker yellow, positioned on left side)
  ctx.fillStyle = '#D4AC0D';
  ctx.beginPath();
  ctx.roundRect(-halfSize + 4, -4, 12, 10, 2);
  ctx.fill();
  
  // Draw eye (white with black pupil)
  // Eye position: upper right quadrant
  const eyeX = 4;
  const eyeY = -6;
  
  // White of eye
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2);
  ctx.fill();
  
  // Black pupil
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(eyeX + 2, eyeY, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Small highlight in pupil
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(eyeX + 3, eyeY - 1, 1, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw beak (orange, triangle pointing right)
  ctx.fillStyle = '#E67E22';
  ctx.beginPath();
  ctx.moveTo(halfSize - 4, -2);
  ctx.lineTo(halfSize + 8, 3);
  ctx.lineTo(halfSize - 4, 8);
  ctx.closePath();
  ctx.fill();
  
  // Beak outline
  ctx.strokeStyle = '#D35400';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.restore();
}
