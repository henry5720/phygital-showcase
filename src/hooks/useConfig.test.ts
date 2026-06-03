import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useConfig } from './useConfig'

describe('useConfig', () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty('--color-primary')
    document.documentElement.style.removeProperty('--color-bg')
    document.documentElement.style.removeProperty('--color-text')
  })

  it('injects --color-primary on mount', () => {
    renderHook(() => useConfig())
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#D4AF37')
  })

  it('injects --color-bg on mount', () => {
    renderHook(() => useConfig())
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#051129')
  })

  it('injects --color-text on mount', () => {
    renderHook(() => useConfig())
    expect(document.documentElement.style.getPropertyValue('--color-text')).toBe('#FFFFFF')
  })

  it('returns the config object with brand name', () => {
    const { result } = renderHook(() => useConfig())
    expect(result.current.brand.name).toBe("植酌 Fizz't")
  })
})
