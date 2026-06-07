import { config } from './index'

export function applyDesignTokens(root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--color-primary', config.tokens.primaryColor)
  root.style.setProperty('--color-bg', config.tokens.backgroundColor)
  root.style.setProperty('--color-text', config.tokens.textColor)
}
