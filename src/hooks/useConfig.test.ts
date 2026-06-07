import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useConfig } from './useConfig'

describe('useConfig', () => {
  it('returns the config object with brand name', () => {
    const { result } = renderHook(() => useConfig())

    expect(result.current.brand.name).toBe("植酌 Fizz't")
  })
})
