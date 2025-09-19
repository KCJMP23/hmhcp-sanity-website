/**
 * Button Component
 * Re-exports StandardButton which wraps LiquidGlassButton for consistency
 * This ensures all buttons across the site use the same design system
 */

export { Button, StandardButton, type StandardButtonProps as ButtonProps } from './standard-button'
export { buttonVariants } from './button-variants'