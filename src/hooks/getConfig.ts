import { config } from '../config'
import type { ProductConfig } from '../config/types'

export function getConfig(): ProductConfig {
  return config
}
