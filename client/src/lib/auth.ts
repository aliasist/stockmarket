/**
 * Auth utilities — JWT token management and user session helpers.
 * Tokens are stored in localStorage under well-known keys.
 */

const ACCESS_TOKEN_KEY = "mp_access_token"
const REFRESH_TOKEN_KEY = "mp_refresh_token"

export interface AuthUser {
  id: number
  email: string
  createdAt?: string
}

// ── Token storage ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setToken(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function clearToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

// ── Token validation ──────────────────────────────────────────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  const token = getToken()
  if (!token) return false
  const payload = decodeJwtPayload(token)
  if (!payload) return false
  const exp = payload.exp as number | undefined
  if (exp && exp < Math.floor(Date.now() / 1000)) return false
  return true
}

export function isTokenExpired(): boolean {
  const token = getToken()
  if (!token) return true
  const payload = decodeJwtPayload(token)
  if (!payload) return true
  const exp = payload.exp as number | undefined
  return !exp || exp < Math.floor(Date.now() / 1000)
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getUser(): Promise<AuthUser | null> {
  const token = getToken()
  if (!token) return null

  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) {
      clearToken()
      return false
    }
    const data = await res.json() as { accessToken: string; refreshToken: string }
    setToken(data.accessToken, data.refreshToken)
    return true
  } catch {
    clearToken()
    return false
  }
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken()
  if (refreshToken) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
      })
    } catch {
      // Ignore network errors on logout
    }
  }
  clearToken()
  window.location.hash = "#/login"
}
