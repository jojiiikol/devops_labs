import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { serve } from './server.js'

describe('serve function', () => {
  beforeEach(() => {
    vi.stubGlobal('Bun', {
      file: vi.fn((path) => ({
        exists: vi.fn().mockResolvedValue(path === './index.html'),
      })),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('serves root as index.html when file exists', async () => {
    const response = await serve('/')
    expect(response.status).toBe(200)
    expect(globalThis.Bun.file).toHaveBeenCalledWith('./index.html')
  })

  it('serves static files when they exist', async () => {
    const response = await serve('/index.html')
    expect(response.status).toBe(200)
  })

  it('falls back to index.html for unknown paths', async () => {
    const response = await serve('/unknown/path')
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/html')
    expect(globalThis.Bun.file).toHaveBeenCalledWith('./unknown/path')
    expect(globalThis.Bun.file).toHaveBeenCalledWith('./index.html')
  })

  it('handles paths without leading slash', async () => {
    const response = await serve('index.html')
    expect(response.status).toBe(200)
  })
})
