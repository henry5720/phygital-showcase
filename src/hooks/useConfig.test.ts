import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { applyDesignTokens } from '../config/applyDesignTokens'
import { useConfig } from './useConfig'

describe('applyDesignTokens', () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty('--color-primary')
    document.documentElement.style.removeProperty('--color-bg')
    document.documentElement.style.removeProperty('--color-text')
  })

  it('injects design token CSS variables', () => {
    applyDesignTokens()

    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#D4AF37')
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#051129')
    expect(document.documentElement.style.getPropertyValue('--color-text')).toBe('#FFFFFF')
  })
})

describe('useConfig', () => {
  it('returns the config object with brand name', () => {
    const { result } = renderHook(() => useConfig())

    expect(result.current.brand.name).toBe("植酌 Fizz't")
  })
})
