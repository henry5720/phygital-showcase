import { useEffect } from 'react'
import { config } from '../config'
import type { ProductConfig } from '../config/types'

export function useConfig(): ProductConfig {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-primary', config.theme.primaryColor)
    root.style.setProperty('--color-bg', config.theme.backgroundColor)
    root.style.setProperty('--color-text', config.theme.textColor)
  }, [])

  return config
}
