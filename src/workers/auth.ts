/**
 * Authentication Worker Handlers
 * Supports email/password and Google OAuth.
 * Issues JWT access tokens (24h) and refresh tokens (7d) stored in D1.
 */

export interface Env {
  DB: D1Database
  JWT_SECRET: string
  GOOGLE_OAUTH_CLIENT_ID: string
  GOOGLE_OAUTH_CLIENT_SECRET: string
}

// ── JWT helpers (Web Crypto API — no npm deps needed in Workers) ─────────────

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds: number
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" }
  const now = Math.floor(Date.now() / 1000)
  const claims = { ...payload, iat: now, exp: now + expiresInSeconds }

  const headerB64 = base64url(new TextEncoder().encode(JSON.stringify(header)))
  const payloadB64 = base64url(new TextEncoder().encode(JSON.stringify(claims)))
  const signingInput = `${headerB64}.${payloadB64}`

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput))
  return `${signingInput}.${base64url(sig)}`
}

export async function verifyJwt(
  token: string,
  secret: string
): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, sigB64] = parts
    const signingInput = `${headerB64}.${payloadB64}`

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    )
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlDecode(sigB64),
      new TextEncoder().encode(signingInput)
    )
    if (!valid) return null

    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

// ── Password hashing (PBKDF2 via Web Crypto) ─────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256
  )
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("")
  const hashHex = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("")
  return `pbkdf2:${saltHex}:${hashHex}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, saltHex, hashHex] = stored.split(":")
  if (!saltHex || !hashHex) return false
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)))
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256
  )
  const candidate = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("")
  return candidate === hashHex
}

// ── Token generation ──────────────────────────────────────────────────────────

function generateRefreshToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function issueTokenPair(
  userId: number,
  email: string,
  env: Env
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await signJwt({ sub: userId, email }, env.JWT_SECRET, 24 * 60 * 60)
  const refreshToken = generateRefreshToken()

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  await env.DB.prepare(
    "INSERT INTO sessions (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)"
  )
    .bind(userId, refreshToken, expiresAt, new Date().toISOString())
    .run()

  return { accessToken, refreshToken }
}

// ── CORS helper ───────────────────────────────────────────────────────────────

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  })
}

// ── Route handlers ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { email, password }
 */
export async function handleRegister(request: Request, env: Env): Promise<Response> {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const { email, password } = body
  if (!email || !password) return json({ error: "email and password are required" }, 400)
  if (password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Invalid email address" }, 400)

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email.toLowerCase())
    .first()
  if (existing) return json({ error: "An account with this email already exists" }, 409)

  const passwordHash = await hashPassword(password)
  const now = new Date().toISOString()

  const result = await env.DB.prepare(
    "INSERT INTO users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?) RETURNING id"
  )
    .bind(email.toLowerCase(), passwordHash, now, now)
    .first<{ id: number }>()

  if (!result) return json({ error: "Failed to create account" }, 500)

  const tokens = await issueTokenPair(result.id, email.toLowerCase(), env)
  return json({
    user: { id: result.id, email: email.toLowerCase() },
    ...tokens,
  }, 201)
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function handleLogin(request: Request, env: Env): Promise<Response> {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const { email, password } = body
  if (!email || !password) return json({ error: "email and password are required" }, 400)

  const user = await env.DB.prepare(
    "SELECT id, email, password_hash FROM users WHERE email = ?"
  )
    .bind(email.toLowerCase())
    .first<{ id: number; email: string; password_hash: string | null }>()

  if (!user || !user.password_hash) {
    return json({ error: "Invalid email or password" }, 401)
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) return json({ error: "Invalid email or password" }, 401)

  const tokens = await issueTokenPair(user.id, user.email, env)
  return json({ user: { id: user.id, email: user.email }, ...tokens })
}

/**
 * POST /api/auth/google
 * Body: { code } — authorization code from Google OAuth flow
 */
export async function handleGoogleOAuth(request: Request, env: Env): Promise<Response> {
  let body: { code?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const { code } = body
  if (!code) return json({ error: "Authorization code is required" }, 400)

  // Exchange code for tokens
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: `${new URL(request.url).origin}/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  })

  if (!tokenResp.ok) return json({ error: "Failed to exchange Google authorization code" }, 400)

  const tokenData = await tokenResp.json() as { id_token?: string; access_token?: string }
  if (!tokenData.id_token) return json({ error: "No ID token returned from Google" }, 400)

  // Decode the ID token (verify with Google's public keys in production)
  const idTokenParts = tokenData.id_token.split(".")
  const googlePayload = JSON.parse(atob(idTokenParts[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
    sub: string
    email: string
    email_verified: boolean
  }

  if (!googlePayload.email_verified) return json({ error: "Google email not verified" }, 400)

  const now = new Date().toISOString()
  let user = await env.DB.prepare(
    "SELECT id, email FROM users WHERE google_id = ? OR email = ?"
  )
    .bind(googlePayload.sub, googlePayload.email.toLowerCase())
    .first<{ id: number; email: string }>()

  if (!user) {
    // Create new user
    const result = await env.DB.prepare(
      "INSERT INTO users (email, google_id, created_at, updated_at) VALUES (?, ?, ?, ?) RETURNING id"
    )
      .bind(googlePayload.email.toLowerCase(), googlePayload.sub, now, now)
      .first<{ id: number }>()

    if (!result) return json({ error: "Failed to create account" }, 500)
    user = { id: result.id, email: googlePayload.email.toLowerCase() }
  } else {
    // Link Google ID if not already linked
    await env.DB.prepare("UPDATE users SET google_id = ?, updated_at = ? WHERE id = ? AND google_id IS NULL")
      .bind(googlePayload.sub, now, user.id)
      .run()
  }

  const tokens = await issueTokenPair(user.id, user.email, env)
  return json({ user: { id: user.id, email: user.email }, ...tokens })
}

/**
 * POST /api/auth/logout
 * Requires Authorization: Bearer <refreshToken>
 */
export async function handleLogout(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get("Authorization")
  const token = auth?.replace("Bearer ", "")
  if (token) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run()
  }
  return json({ message: "Logged out" })
}

/**
 * GET /api/auth/me
 * Requires Authorization: Bearer <accessToken>
 */
export async function handleMe(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get("Authorization")
  const token = auth?.replace("Bearer ", "")
  if (!token) return json({ error: "Unauthorized" }, 401)

  const payload = await verifyJwt(token, env.JWT_SECRET)
  if (!payload) return json({ error: "Invalid or expired token" }, 401)

  const user = await env.DB.prepare("SELECT id, email, created_at FROM users WHERE id = ?")
    .bind(payload.sub)
    .first<{ id: number; email: string; created_at: string }>()

  if (!user) return json({ error: "User not found" }, 404)
  return json({ id: user.id, email: user.email, createdAt: user.created_at })
}

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
export async function handleRefresh(request: Request, env: Env): Promise<Response> {
  let body: { refreshToken?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const { refreshToken } = body
  if (!refreshToken) return json({ error: "refreshToken is required" }, 400)

  const session = await env.DB.prepare(
    "SELECT user_id, expires_at FROM sessions WHERE token = ?"
  )
    .bind(refreshToken)
    .first<{ user_id: number; expires_at: string }>()

  if (!session) return json({ error: "Invalid refresh token" }, 401)
  if (new Date(session.expires_at) < new Date()) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(refreshToken).run()
    return json({ error: "Refresh token expired" }, 401)
  }

  const user = await env.DB.prepare("SELECT id, email FROM users WHERE id = ?")
    .bind(session.user_id)
    .first<{ id: number; email: string }>()

  if (!user) return json({ error: "User not found" }, 404)

  // Rotate refresh token
  await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(refreshToken).run()
  const tokens = await issueTokenPair(user.id, user.email, env)
  return json({ user: { id: user.id, email: user.email }, ...tokens })
}
