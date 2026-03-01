import { describe, expect, it, beforeEach } from 'vitest'
import { clearAuthTokenCookie, getAuthTokenCookie, setAuthTokenCookie } from './authTokenCookie'

describe('authTokenCookie utilities', () => {
  beforeEach(() => {
    clearAuthTokenCookie()
  })

  it('sets and reads token from cookie', () => {
    setAuthTokenCookie('secret token')
    expect(document.cookie).toContain('notes_access_token=')
    expect(getAuthTokenCookie()).toBe('secret token')
  })

  it('returns null when cookie is missing', () => {
    expect(getAuthTokenCookie()).toBeNull()
  })

  it('clears token cookie', () => {
    setAuthTokenCookie('to-be-cleared')
    expect(getAuthTokenCookie()).toBe('to-be-cleared')
    clearAuthTokenCookie()
    expect(getAuthTokenCookie()).toBeNull()
  })

  it('gracefully handles malformed encoded value', () => {
    document.cookie = 'notes_access_token=%E0%A4%A'
    expect(getAuthTokenCookie()).toBe('%E0%A4%A')
  })
})

