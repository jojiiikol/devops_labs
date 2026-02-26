const COOKIE_NAME = 'notes_access_token'

function cookieAttributes(): string {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  return `; Path=/; SameSite=Lax${secure}`
}

export function setAuthTokenCookie(token: string): void {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}${cookieAttributes()}`
}

export function getAuthTokenCookie(): string | null {
  const raw = document.cookie
  if (!raw) return null

  const parts = raw.split(';')
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=')
    if (k === COOKIE_NAME) {
      const value = rest.join('=')
      if (!value) return null
      try {
        return decodeURIComponent(value)
      } catch {
        return value
      }
    }
  }
  return null
}

export function clearAuthTokenCookie(): void {
  document.cookie = `${COOKIE_NAME}=; Max-Age=0${cookieAttributes()}`
}

