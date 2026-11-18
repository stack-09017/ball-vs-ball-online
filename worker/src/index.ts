// ============================================================================
// BALL VS BALL — CLOUDFLARE WORKER + DURABLE OBJECTS + D1 + WEB CRYPTO
// ============================================================================

// Minimal Cloudflare Worker runtime structural interfaces for clean compilation
// both inside /worker (with @cloudflare/workers-types) and in root typecheck.
interface WorkerD1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: {
    changes?: number;
  };
}

interface WorkerD1PreparedStatement {
  bind(...values: unknown[]): WorkerD1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<WorkerD1Result<T>>;
  run(): Promise<WorkerD1Result>;
}

interface WorkerD1Database {
  prepare(query: string): WorkerD1PreparedStatement;
}

interface WorkerDurableObjectStub {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface WorkerDurableObjectId {
  toString(): string;
}

interface WorkerDurableObjectNamespace {
  idFromName(name: string): WorkerDurableObjectId;
  get(id: WorkerDurableObjectId): WorkerDurableObjectStub;
}

interface WorkerDurableObjectStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
}

interface WorkerDurableObjectState {
  id: WorkerDurableObjectId;
  storage: WorkerDurableObjectStorage;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
}

interface WorkerWebSocket extends WebSocket {
  accept(): void;
}

function createWebSocketPair(): { 0: WebSocket; 1: WorkerWebSocket } {
  const PairCtor = (globalThis as unknown as {
    WebSocketPair: new () => { 0: WebSocket; 1: WorkerWebSocket };
  }).WebSocketPair;
  return new PairCtor();
}

export interface Env {
  DB: WorkerD1Database;
  MATCHMAKER: WorkerDurableObjectNamespace;
  GAME_ROOM: WorkerDurableObjectNamespace;
  JWT_SECRET?: string;
  ALLOWED_ORIGIN?: string;
  GOOGLE_CLIENT_ID?: string;
}

interface UserRow {
  id: string;
  username: string;
  password_hash: string | null;
  google_sub?: string | null;
  email?: string | null;
  coins: number;
  is_guest: number;
  unlocked_balls: string;
  created_at?: string;
  updated_at?: string;
}

interface PublicUser {
  _id: string;
  username: string;
  email?: string;
  coins: number;
  isGuest: boolean;
  unlockedBalls: string[];
}

interface JwtClaims {
  _id: string;
  id: string;
  username: string;
  isGuest: boolean;
  iat: number;
  exp: number;
}

interface WsEnvelope<T = unknown> {
  type: string;
  payload?: T;
  requestId?: string;
}

const DEFAULT_JWT_SECRET = 'ball_vs_ball_dev_secret_change_in_production';
const PBKDF2_ITERATIONS = 100_000;
const JWT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const CHARACTER_UNLOCK_COST = 100;
const SAITAMA_UNLOCK_COST = 9999;
const DRAFT_REROLL_COST = 25;
const WINNER_COIN_REWARD = 50;
const LOSER_COIN_REWARD = 10;

function getAuthoritativeCharacterCost(characterId: string): number {
  return characterId.trim() === 'capedbaldy' ? SAITAMA_UNLOCK_COST : CHARACTER_UNLOCK_COST;
}

// Arena geometry matching the HTML5 1280x720 Canvas (620x620 inner square)
const CANVAS_W = 1280;
const CANVAS_H = 720;
const ARENA_SIZE = 620;
const WALL_THICKNESS = 20;
const ARENA_INNER_LEFT = (CANVAS_W - ARENA_SIZE) / 2 + WALL_THICKNESS;
const ARENA_INNER_RIGHT = (CANVAS_W + ARENA_SIZE) / 2 - WALL_THICKNESS;
const ARENA_INNER_TOP = (CANVAS_H - ARENA_SIZE) / 2 + WALL_THICKNESS;
const ARENA_INNER_BOTTOM = (CANVAS_H + ARENA_SIZE) / 2 - WALL_THICKNESS;
const BALL_RADIUS = 38.4 * 1.3; // 49.92px
const BALL_MASS = 32;
const LAUNCH_SPEED = 11.5;
const BASE_FRICTION = 0.9985;
const NORMAL_BASE_SPEED = 13.8;
const NORMAL_MIN_SPEED = 6.2;
const TICK_HZ = 30;
const TICK_MS = Math.round(1000 / TICK_HZ);

// ============================================================================
// CORS & HTTP RESPONSE HELPERS
// ============================================================================
function getCorsHeaders(request: Request, env: Env): Record<string, string> {
  const reqOrigin = request.headers.get('Origin') || '';
  const rawAllowed = (env.ALLOWED_ORIGIN || '*').trim();
  let allowOrigin = '*';

  if (rawAllowed === '*' || !rawAllowed) {
    allowOrigin = reqOrigin || '*';
  } else {
    const allowedList = rawAllowed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (reqOrigin && allowedList.includes(reqOrigin)) {
      allowOrigin = reqOrigin;
    } else if (allowedList.length > 0) {
      allowOrigin = allowedList[0];
    }
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function jsonResponse(
  request: Request,
  env: Env,
  data: unknown,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(request, env),
    },
  });
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function sendWs(ws: WebSocket | null | undefined, type: string, payload?: unknown, requestId?: string): void {
  if (!ws || ws.readyState !== 1) return;
  try {
    const msg: WsEnvelope = requestId ? { type, payload, requestId } : { type, payload };
    ws.send(JSON.stringify(msg));
  } catch {
    // Socket closed mid-send
  }
}

// ============================================================================
// NATIVE WEB CRYPTO API: PBKDF2 PASSWORD HASHING & HMAC-SHA256 JWT
// ============================================================================
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

function fromHex(hex: string): Uint8Array {
  const len = Math.floor(hex.length / 2);
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function base64UrlEncode(input: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < input.length; i++) {
    binary += String.fromCharCode(input[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password) as unknown as BufferSource,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return `${toHex(salt)}:${toHex(new Uint8Array(derivedBits))}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [saltHex, expectedHex] = parts;
  if (!saltHex || !expectedHex) return false;

  const salt = fromHex(saltHex);
  const expected = fromHex(expectedHex);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password) as unknown as BufferSource,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return timingSafeEqual(new Uint8Array(derivedBits), expected);
}

async function getHmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret) as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

async function signJwt(
  user: { _id: string; username: string; isGuest: boolean },
  secret: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const claims: JwtClaims = {
    _id: user._id,
    id: user._id,
    username: user.username,
    isGuest: user.isGuest,
    iat: now,
    exp: now + JWT_TTL_SECONDS,
  };
  const headerB64 = base64UrlEncode(textEncoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payloadB64 = base64UrlEncode(textEncoder.encode(JSON.stringify(claims)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await getHmacKey(secret, 'sign');
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    textEncoder.encode(signingInput) as unknown as BufferSource
  );
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  return `${signingInput}.${signatureB64}`;
}

async function verifyJwt(token: string, secret: string): Promise<JwtClaims | null> {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;
  if (!headerB64 || !payloadB64 || !signatureB64) return null;

  try {
    const signingInput = `${headerB64}.${payloadB64}`;
    const key = await getHmacKey(secret, 'verify');
    const signature = base64UrlDecode(signatureB64);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature as unknown as BufferSource,
      textEncoder.encode(signingInput) as unknown as BufferSource
    );
    if (!valid) return null;

    const claimsJson = textDecoder.decode(base64UrlDecode(payloadB64));
    const claims = JSON.parse(claimsJson) as JwtClaims;
    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp === 'number' && claims.exp < now) return null;
    if (!claims._id && !claims.id) return null;
    return {
      ...claims,
      _id: String(claims._id || claims.id),
      id: String(claims._id || claims.id),
    };
  } catch {
    return null;
  }
}

// ============================================================================
// CLOUDFLARE D1 DATABASE HELPERS
// ============================================================================
function parseUnlockedBalls(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function toPublicUser(row: UserRow): PublicUser {
  return {
    _id: row.id,
    username: row.username,
    ...(row.email ? { email: row.email } : {}),
    coins: Number(row.coins) || 0,
    isGuest: Boolean(row.is_guest),
    unlockedBalls: parseUnlockedBalls(row.unlocked_balls),
  };
}

let usersGoogleSchemaEnsured = false;

async function ensureUsersGoogleSchema(db: WorkerD1Database): Promise<void> {
  if (usersGoogleSchemaEnsured) return;
  try {
    const info = await db.prepare('PRAGMA table_info(users)').all<{ name?: string }>();
    const cols = new Set((info.results || []).map((c) => String(c.name || '')));
    if (!cols.has('google_sub')) {
      await db.prepare('ALTER TABLE users ADD COLUMN google_sub TEXT').run();
    }
    if (!cols.has('email')) {
      await db.prepare('ALTER TABLE users ADD COLUMN email TEXT').run();
    }
    await db
      .prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub)')
      .run();
    usersGoogleSchemaEnsured = true;
  } catch {
    // Fallback if ALTER raced across workers; re-check next call
  }
}

async function findUserById(db: WorkerD1Database, id: string): Promise<UserRow | null> {
  if (!id) return null;
  await ensureUsersGoogleSchema(db);
  return db
    .prepare(
      'SELECT id, username, password_hash, google_sub, email, coins, is_guest, unlocked_balls FROM users WHERE id = ?'
    )
    .bind(id)
    .first<UserRow>();
}

async function findUserByUsername(db: WorkerD1Database, username: string): Promise<UserRow | null> {
  await ensureUsersGoogleSchema(db);
  return db
    .prepare(
      'SELECT id, username, password_hash, google_sub, email, coins, is_guest, unlocked_balls FROM users WHERE username = ? COLLATE NOCASE'
    )
    .bind(username.trim())
    .first<UserRow>();
}

async function findUserByGoogleSub(db: WorkerD1Database, googleSub: string): Promise<UserRow | null> {
  if (!googleSub) return null;
  await ensureUsersGoogleSchema(db);
  return db
    .prepare(
      'SELECT id, username, password_hash, google_sub, email, coins, is_guest, unlocked_balls FROM users WHERE google_sub = ?'
    )
    .bind(googleSub)
    .first<UserRow>();
}

async function incrementUserCoinsInD1(
  db: WorkerD1Database,
  userId: string,
  delta: number
): Promise<PublicUser | null> {
  if (!userId) return null;
  await db
    .prepare(
      `UPDATE users
       SET coins = MAX(0, coins + ?), updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(delta, userId)
    .run();
  const updated = await findUserById(db, userId);
  return updated ? toPublicUser(updated) : null;
}

async function purchaseCharacterInD1(
  db: WorkerD1Database,
  userId: string,
  characterId: string,
  cost: number
): Promise<{ ok: boolean; user?: PublicUser; alreadyUnlocked?: boolean; error?: string }> {
  const row = await findUserById(db, userId);
  if (!row) return { ok: false, error: 'Account not found.' };

  const cleanId = characterId.trim();
  if (!cleanId) return { ok: false, error: 'Invalid character ID.' };

  const unlocked = parseUnlockedBalls(row.unlocked_balls);
  if (unlocked.includes(cleanId)) {
    return { ok: true, user: toPublicUser(row), alreadyUnlocked: true };
  }

  if ((Number(row.coins) || 0) < cost) {
    return { ok: false, error: 'Insufficient coins to purchase character.' };
  }

  const nextUnlocked = [...unlocked, cleanId];
  const res = await db
    .prepare(
      `UPDATE users
       SET coins = coins - ?, unlocked_balls = ?, updated_at = datetime('now')
       WHERE id = ? AND coins >= ?`
    )
    .bind(cost, JSON.stringify(nextUnlocked), userId, cost)
    .run();

  if ((res.meta?.changes ?? 0) === 0) {
    return { ok: false, error: 'Insufficient coins to purchase character.' };
  }

  const updated = await findUserById(db, userId);
  return updated
    ? { ok: true, user: toPublicUser(updated) }
    : { ok: false, error: 'Failed to reload account.' };
}

async function rerollDraftInD1(
  db: WorkerD1Database,
  userId: string
): Promise<{ ok: boolean; user?: PublicUser; error?: string }> {
  const res = await db
    .prepare(
      `UPDATE users
       SET coins = coins - ?, updated_at = datetime('now')
       WHERE id = ? AND coins >= ?`
    )
    .bind(DRAFT_REROLL_COST, userId, DRAFT_REROLL_COST)
    .run();

  if ((res.meta?.changes ?? 0) === 0) {
    return { ok: false, error: 'Not enough coins to re-roll (25 Coins required).' };
  }
  const updated = await findUserById(db, userId);
  return updated
    ? { ok: true, user: toPublicUser(updated) }
    : { ok: false, error: 'Account not found.' };
}

// ============================================================================
// HTTP AUTHENTICATION & WALLET WEBSOCKET HANDLERS
// ============================================================================
function extractBearerToken(request: Request): string {
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const url = new URL(request.url);
  return (url.searchParams.get('token') || '').trim();
}

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  const username = typeof body.username === 'string' ? body.username.trim().slice(0, 24) : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (username.length < 2) {
    return jsonResponse(request, env, { error: 'Username must be at least 2 characters.' }, 400);
  }
  if (password.length < 4) {
    return jsonResponse(request, env, { error: 'Password must be at least 4 characters.' }, 400);
  }

  const existing = await findUserByUsername(env.DB, username);
  if (existing) {
    return jsonResponse(request, env, { error: 'Username already exists.' }, 409);
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await env.DB
    .prepare(
      `INSERT INTO users (id, username, password_hash, coins, is_guest, unlocked_balls)
       VALUES (?, ?, ?, 0, 0, '[]')`
    )
    .bind(id, username, passwordHash)
    .run();

  const publicUser: PublicUser = {
    _id: id,
    username,
    coins: 0,
    isGuest: false,
    unlockedBalls: [],
  };
  const token = await signJwt(publicUser, env.JWT_SECRET || DEFAULT_JWT_SECRET);
  return jsonResponse(request, env, { token, user: publicUser }, 201);
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password) {
    return jsonResponse(request, env, { error: 'Username and password are required.' }, 400);
  }

  const row = await findUserByUsername(env.DB, username);
  if (!row || !row.password_hash) {
    return jsonResponse(request, env, { error: 'Invalid username or password.' }, 401);
  }

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) {
    return jsonResponse(request, env, { error: 'Invalid username or password.' }, 401);
  }

  const publicUser = toPublicUser(row);
  const token = await signJwt(publicUser, env.JWT_SECRET || DEFAULT_JWT_SECRET);
  return jsonResponse(request, env, { token, user: publicUser });
}

async function handleGuest(request: Request, env: Env): Promise<Response> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const guestName = `Guest_${num}`;
    const existing = await findUserByUsername(env.DB, guestName);
    if (existing) continue;

    const id = crypto.randomUUID();
    await env.DB
      .prepare(
        `INSERT INTO users (id, username, password_hash, coins, is_guest, unlocked_balls)
         VALUES (?, ?, NULL, 0, 1, '[]')`
      )
      .bind(id, guestName)
      .run();

    const publicUser: PublicUser = {
      _id: id,
      username: guestName,
      coins: 0,
      isGuest: true,
      unlockedBalls: [],
    };
    const token = await signJwt(publicUser, env.JWT_SECRET || DEFAULT_JWT_SECRET);
    return jsonResponse(request, env, { token, user: publicUser }, 201);
  }

  return jsonResponse(request, env, { error: 'Could not allocate guest username.' }, 500);
}

async function handleLinkAccount(request: Request, env: Env): Promise<Response> {
  const token = extractBearerToken(request);
  const claims = await verifyJwt(token, env.JWT_SECRET || DEFAULT_JWT_SECRET);
  if (!claims) {
    return jsonResponse(request, env, { error: 'Unauthorized.' }, 401);
  }

  const body = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  const username = typeof body.username === 'string' ? body.username.trim().slice(0, 24) : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (username.length < 2 || password.length < 4) {
    return jsonResponse(
      request,
      env,
      { error: 'Username (min 2 chars) and password (min 4 chars) are required.' },
      400
    );
  }

  const conflict = await findUserByUsername(env.DB, username);
  if (conflict && conflict.id !== claims._id) {
    return jsonResponse(request, env, { error: 'Username already taken.' }, 409);
  }

  const passwordHash = await hashPassword(password);
  await env.DB
    .prepare(
      `UPDATE users
       SET username = ?, password_hash = ?, is_guest = 0, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(username, passwordHash, claims._id)
    .run();

  const updated = await findUserById(env.DB, claims._id);
  if (!updated) {
    return jsonResponse(request, env, { error: 'Account not found.' }, 404);
  }

  const publicUser = toPublicUser(updated);
  const nextToken = await signJwt(publicUser, env.JWT_SECRET || DEFAULT_JWT_SECRET);
  return jsonResponse(request, env, { token: nextToken, user: publicUser });
}

async function handleAuthMe(request: Request, env: Env): Promise<Response> {
  const token = extractBearerToken(request);
  const claims = await verifyJwt(token, env.JWT_SECRET || DEFAULT_JWT_SECRET);
  if (!claims) {
    return jsonResponse(request, env, { error: 'Unauthorized.' }, 401);
  }

  const row = await findUserById(env.DB, claims._id);
  if (!row) {
    return jsonResponse(request, env, { error: 'User not found.' }, 404);
  }

  return jsonResponse(request, env, { user: toPublicUser(row) });
}

async function handleAuthProgress(request: Request, env: Env): Promise<Response> {
  const token = extractBearerToken(request);
  const claims = await verifyJwt(token, env.JWT_SECRET || DEFAULT_JWT_SECRET);
  if (!claims) {
    return jsonResponse(request, env, { error: 'Unauthorized.' }, 401);
  }

  const body = (await request.json().catch(() => ({}))) as { username?: string };
  const requestedName = typeof body.username === 'string' ? body.username.trim().slice(0, 12) : '';

  if (requestedName.length >= 2) {
    const conflict = await findUserByUsername(env.DB, requestedName);
    if (!conflict || conflict.id === claims._id) {
      await env.DB
        .prepare(`UPDATE users SET username = ?, updated_at = datetime('now') WHERE id = ?`)
        .bind(requestedName, claims._id)
        .run();
    }
  }

  const updated = await findUserById(env.DB, claims._id);
  if (!updated) {
    return jsonResponse(request, env, { error: 'User not found.' }, 404);
  }
  const publicUser = toPublicUser(updated);
  const refreshedToken = await signJwt(publicUser, env.JWT_SECRET || DEFAULT_JWT_SECRET);
  return jsonResponse(request, env, { token: refreshedToken, user: publicUser });
}

interface GoogleJwk extends JsonWebKey {
  kid?: string;
}

interface GoogleIdTokenPayload {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  aud?: string;
  iss?: string;
  exp?: number;
}

let cachedGoogleCerts: { keys: GoogleJwk[]; fetchedAt: number } | null = null;

async function fetchGoogleJwks(forceRefresh = false): Promise<GoogleJwk[]> {
  const now = Date.now();
  if (!forceRefresh && cachedGoogleCerts && now - cachedGoogleCerts.fetchedAt < 1000 * 60 * 30) {
    return cachedGoogleCerts.keys;
  }
  const res = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  if (!res.ok) {
    throw new Error('Failed to fetch Google public keys.');
  }
  const body = (await res.json()) as { keys?: GoogleJwk[] };
  const keys = Array.isArray(body.keys) ? body.keys : [];
  cachedGoogleCerts = { keys, fetchedAt: now };
  return keys;
}

async function verifyGoogleIdToken(
  credential: string,
  expectedClientId?: string
): Promise<GoogleIdTokenPayload | null> {
  const parts = credential.trim().split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  if (!headerB64 || !payloadB64 || !sigB64) return null;

  try {
    const header = JSON.parse(textDecoder.decode(base64UrlDecode(headerB64))) as {
      alg?: string;
      kid?: string;
    };
    if (header.alg !== 'RS256' || !header.kid) return null;

    let keys = await fetchGoogleJwks(false);
    let jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) {
      keys = await fetchGoogleJwks(true);
      jwk = keys.find((k) => k.kid === header.kid);
    }
    if (!jwk) return null;

    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = base64UrlDecode(sigB64);
    const signedInput = textEncoder.encode(`${headerB64}.${payloadB64}`);
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      sigBytes as unknown as BufferSource,
      signedInput as unknown as BufferSource
    );
    if (!valid) return null;

    const claims = JSON.parse(
      textDecoder.decode(base64UrlDecode(payloadB64))
    ) as GoogleIdTokenPayload;
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== 'number' || claims.exp < nowSec) return null;
    if (claims.iss !== 'https://accounts.google.com' && claims.iss !== 'accounts.google.com') {
      return null;
    }
    if (!claims.sub) return null;
    if (expectedClientId && expectedClientId.trim() && claims.aud !== expectedClientId.trim()) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

async function allocateUniqueGoogleUsername(
  db: WorkerD1Database,
  rawName?: string,
  rawEmail?: string
): Promise<string> {
  const emailPrefix = rawEmail ? rawEmail.split('@')[0] : '';
  const sanitized = (rawName || emailPrefix || 'Fighter')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 12);
  const base = sanitized.length >= 2 ? sanitized : 'Fighter';

  if (!(await findUserByUsername(db, base))) {
    return base;
  }
  for (let i = 0; i < 12; i++) {
    const suffix = String(Math.floor(100 + Math.random() * 900));
    const candidate = `${base.slice(0, 8)}_${suffix}`;
    if (!(await findUserByUsername(db, candidate))) {
      return candidate;
    }
  }
  return `G_${Math.floor(100000 + Math.random() * 899999)}`;
}

async function handleGoogleAuth(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { credential?: string };
  const credential = typeof body.credential === 'string' ? body.credential.trim() : '';
  if (!credential) {
    return jsonResponse(request, env, { error: 'Missing Google ID credential token.' }, 400);
  }

  const googleClaims = await verifyGoogleIdToken(credential, env.GOOGLE_CLIENT_ID);
  if (!googleClaims || !googleClaims.sub) {
    return jsonResponse(
      request,
      env,
      { error: 'Invalid or expired Google Sign-In token.' },
      401
    );
  }

  const googleSub = googleClaims.sub;
  const googleEmail = typeof googleClaims.email === 'string' ? googleClaims.email : null;

  // 1. Existing Google-linked account -> sign right in
  const existingGoogleUser = await findUserByGoogleSub(env.DB, googleSub);
  if (existingGoogleUser) {
    if (googleEmail && googleEmail !== existingGoogleUser.email) {
      await env.DB
        .prepare(`UPDATE users SET email = ?, updated_at = datetime('now') WHERE id = ?`)
        .bind(googleEmail, existingGoogleUser.id)
        .run();
      existingGoogleUser.email = googleEmail;
    }
    const pub = toPublicUser(existingGoogleUser);
    const token = await signJwt(pub, env.JWT_SECRET || DEFAULT_JWT_SECRET);
    return jsonResponse(request, env, { token, user: pub });
  }

  // 2. If caller holds a valid Guest JWT, link Google account to preserve coins & unlocks
  const bearerToken = extractBearerToken(request);
  if (bearerToken) {
    const callerClaims = await verifyJwt(bearerToken, env.JWT_SECRET || DEFAULT_JWT_SECRET);
    if (callerClaims) {
      const callerRow = await findUserById(env.DB, callerClaims._id);
      if (callerRow && Boolean(callerRow.is_guest) && !callerRow.google_sub) {
        const nextName = callerRow.username.startsWith('Guest_')
          ? await allocateUniqueGoogleUsername(env.DB, googleClaims.given_name || googleClaims.name, googleEmail || undefined)
          : callerRow.username;
        await env.DB
          .prepare(
            `UPDATE users
             SET username = ?, google_sub = ?, email = ?, is_guest = 0, updated_at = datetime('now')
             WHERE id = ?`
          )
          .bind(nextName, googleSub, googleEmail, callerRow.id)
          .run();
        const linked = await findUserById(env.DB, callerRow.id);
        if (linked) {
          const pub = toPublicUser(linked);
          const nextToken = await signJwt(pub, env.JWT_SECRET || DEFAULT_JWT_SECRET);
          return jsonResponse(request, env, { token: nextToken, user: pub });
        }
      }
    }
  }

  // 3. Create new verified Google player account
  const id = crypto.randomUUID();
  const username = await allocateUniqueGoogleUsername(
    env.DB,
    googleClaims.given_name || googleClaims.name,
    googleEmail || undefined
  );
  await env.DB
    .prepare(
      `INSERT INTO users (id, username, password_hash, google_sub, email, coins, is_guest, unlocked_balls)
       VALUES (?, ?, NULL, ?, ?, 0, 0, '[]')`
    )
    .bind(id, username, googleSub, googleEmail)
    .run();

  const publicUser: PublicUser = {
    _id: id,
    username,
    ...(googleEmail ? { email: googleEmail } : {}),
    coins: 0,
    isGuest: false,
    unlockedBalls: [],
  };
  const token = await signJwt(publicUser, env.JWT_SECRET || DEFAULT_JWT_SECRET);
  return jsonResponse(request, env, { token, user: publicUser }, 201);
}

// ============================================================================
// WORKER WALLET WEBSOCKET (For shop purchases, rerolls & solo/bot rewards)
// ============================================================================
async function handleWalletWebSocket(env: Env, claims: JwtClaims): Promise<Response> {
  const pair = createWebSocketPair();
  const client = pair[0];
  const server = pair[1];
  server.accept();

  const user = await findUserById(env.DB, claims._id);
  if (user) {
    const pub = toPublicUser(user);
    sendWs(server, 'wallet_updated', pub.coins);
    sendWs(server, 'unlocked_balls_updated', pub.unlockedBalls);
  }

  server.addEventListener('message', (event: MessageEvent) => {
    void (async () => {
      try {
        const msg = JSON.parse(String(event.data)) as WsEnvelope<Record<string, unknown>>;
        if (msg.type === 'ping_check') {
          sendWs(server, 'pong_check', msg.payload, msg.requestId);
          return;
        }
        if (msg.type === 'purchase_character') {
          const charId = String(msg.payload?.characterId || msg.payload?.ballId || '').trim();
          const cost = getAuthoritativeCharacterCost(charId);
          const result = await purchaseCharacterInD1(env.DB, claims._id, charId, cost);
          if (!result.ok || !result.user) {
            sendWs(server, 'purchase_error', { characterId: charId, error: result.error }, msg.requestId);
            return;
          }
          sendWs(server, 'wallet_updated', result.user.coins, msg.requestId);
          sendWs(server, 'unlocked_balls_updated', result.user.unlockedBalls);
          sendWs(server, 'purchase_success', {
            ok: true,
            coins: result.user.coins,
            unlockedBalls: result.user.unlockedBalls,
          }, msg.requestId);
          return;
        }
        if (msg.type === 'reroll_draft') {
          const result = await rerollDraftInD1(env.DB, claims._id);
          if (!result.ok || !result.user) {
            sendWs(server, 'purchase_error', { error: result.error }, msg.requestId);
            return;
          }
          sendWs(server, 'wallet_updated', result.user.coins, msg.requestId);
          sendWs(server, 'reroll_success', { ok: true, coins: result.user.coins }, msg.requestId);
          return;
        }
        if (msg.type === 'report_match_result') {
          const didWin = Boolean(msg.payload?.didWin);
          const reward = didWin ? WINNER_COIN_REWARD : LOSER_COIN_REWARD;
          const updated = await incrementUserCoinsInD1(env.DB, claims._id, reward);
          if (updated) {
            sendWs(server, 'wallet_updated', updated.coins, msg.requestId);
          }
        }
      } catch {
        // Ignore malformed packets
      }
    })();
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  } as ResponseInit & { webSocket: WebSocket });
}

// ============================================================================
// CLOUDFLARE WORKER ENTRYPOINT (index.ts)
// Handles REST auth endpoints and upgrades WebSocket connections into
// MatchmakerDO or GameRoomDO Durable Objects.
// ============================================================================
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
    }

    // REST API Routes (Auth + Health)
    if (url.pathname === '/api/health') {
      return jsonResponse(request, env, { ok: true, runtime: 'cloudflare-worker' });
    }
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      return handleRegister(request, env);
    }
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }
    if (url.pathname === '/api/auth/google' && request.method === 'POST') {
      return handleGoogleAuth(request, env);
    }
    if (url.pathname === '/api/auth/guest' && (request.method === 'POST' || request.method === 'GET')) {
      return handleGuest(request, env);
    }
    if (url.pathname === '/api/auth/link' && request.method === 'POST') {
      return handleLinkAccount(request, env);
    }
    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      return handleAuthMe(request, env);
    }
    if (url.pathname === '/api/auth/progress' && request.method === 'POST') {
      return handleAuthProgress(request, env);
    }

    // Native WebSocket Upgrade Requests
    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const token = extractBearerToken(request);
      const claims = await verifyJwt(token, env.JWT_SECRET || DEFAULT_JWT_SECRET);
      if (!claims) {
        return new Response('Unauthorized: Invalid or missing JWT', { status: 401 });
      }

      if (url.pathname === '/ws/wallet') {
        return handleWalletWebSocket(env, claims);
      }

      if (url.pathname === '/ws/matchmaker') {
        const matchmakerId = env.MATCHMAKER.idFromName('global-matchmaker');
        const stub = env.MATCHMAKER.get(matchmakerId);
        const forwardedHeaders = new Headers(request.headers);
        forwardedHeaders.set('X-User-Id', claims._id);
        forwardedHeaders.set('X-Username', claims.username);
        return stub.fetch(new Request(request.url, { headers: forwardedHeaders }));
      }

      if (url.pathname.startsWith('/ws/room/')) {
        const roomId = decodeURIComponent(url.pathname.slice('/ws/room/'.length)).trim();
        if (!roomId) {
          return new Response('Missing roomId', { status: 400 });
        }
        const roomObjId = env.GAME_ROOM.idFromName(roomId);
        const stub = env.GAME_ROOM.get(roomObjId);
        const forwardedHeaders = new Headers(request.headers);
        forwardedHeaders.set('X-User-Id', claims._id);
        forwardedHeaders.set('X-Username', claims.username);
        forwardedHeaders.set('X-Room-Id', roomId);
        return stub.fetch(new Request(request.url, { headers: forwardedHeaders }));
      }
    }

    return jsonResponse(request, env, { error: 'Not Found' }, 404);
  },
};

// ============================================================================
// DURABLE OBJECT 1: DEDICATED MATCHMAKER DO
// Manages the global matchmaking queue and passworded custom rooms, then
// initializes an isolated GameRoomDO and notifies both players.
// ============================================================================
interface QueuedPlayer {
  socket: WorkerWebSocket;
  userId: string;
  username: string;
  ballType: string;
  arena: string;
  startingHealth: number;
}

interface CustomLobbyEntry {
  roomId: string;
  password: string;
  host: QueuedPlayer;
}

export class MatchmakerDO {
  private env: Env;
  private waitingQueue: QueuedPlayer[] = [];
  private customRooms = new Map<string, CustomLobbyEntry>();

  constructor(_state: WorkerDurableObjectState, env: Env) {
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const url = new URL(request.url);
    const userId = request.headers.get('X-User-Id') || '';
    const jwtUsername = request.headers.get('X-Username') || 'Fighter';
    const queryUsername = (url.searchParams.get('username') || jwtUsername).trim().slice(0, 12) || 'Fighter';
    const initialBallType = (url.searchParams.get('ballType') || 'quadblade').trim();
    const initialArena = (url.searchParams.get('arena') || 'Default').trim();
    const initialHp = clamp(Number(url.searchParams.get('startingHealth')) || 100, 50, 200);
    const customOnly = url.searchParams.get('customLobby') === 'true';

    const pair = createWebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    const player: QueuedPlayer = {
      socket: server,
      userId,
      username: queryUsername,
      ballType: initialBallType,
      arena: initialArena,
      startingHealth: initialHp,
    };

    if (!customOnly) {
      this.enqueuePlayer(player);
    }

    server.addEventListener('message', (event: MessageEvent) => {
      void this.handleMessage(player, String(event.data));
    });

    server.addEventListener('close', () => {
      this.removePlayer(player);
    });

    server.addEventListener('error', () => {
      this.removePlayer(player);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    } as ResponseInit & { webSocket: WebSocket });
  }

  private removePlayer(player: QueuedPlayer): void {
    this.waitingQueue = this.waitingQueue.filter(
      (p) => p.socket !== player.socket && p.socket.readyState === 1
    );
    for (const [roomId, lobby] of this.customRooms.entries()) {
      if (lobby.host.socket === player.socket) {
        this.customRooms.delete(roomId);
      }
    }
  }

  private enqueuePlayer(player: QueuedPlayer): void {
    this.waitingQueue = this.waitingQueue.filter(
      (p) => p.socket.readyState === 1 && p.userId !== player.userId
    );
    this.waitingQueue.push(player);

    if (this.waitingQueue.length < 2) {
      sendWs(player.socket, 'waiting_for_opponent', {
        status: 'waiting',
        queuePosition: this.waitingQueue.length,
      });
      return;
    }

    void this.tryPairWaitingPlayers();
  }

  private async tryPairWaitingPlayers(): Promise<void> {
    this.waitingQueue = this.waitingQueue.filter((p) => p.socket.readyState === 1);
    while (this.waitingQueue.length >= 2) {
      const p1 = this.waitingQueue.shift();
      const p2 = this.waitingQueue.shift();
      if (!p1 || !p2 || p1.socket.readyState !== 1 || p2.socket.readyState !== 1) {
        if (p1 && p1.socket.readyState === 1) this.waitingQueue.unshift(p1);
        if (p2 && p2.socket.readyState === 1) this.waitingQueue.unshift(p2);
        break;
      }

      const roomId = this.generateUniqueRoomCode();
      await this.pairPlayersIntoGameRoom(roomId, p1, p2);
    }
  }

  private generateUniqueRoomCode(): string {
    let code = '';
    do {
      code = `match_${Math.floor(1000 + Math.random() * 9000)}`;
    } while (this.customRooms.has(code));
    return code;
  }

  private async pairPlayersIntoGameRoom(
    roomId: string,
    p1: QueuedPlayer,
    p2: QueuedPlayer
  ): Promise<void> {
    const stub = this.env.GAME_ROOM.get(this.env.GAME_ROOM.idFromName(roomId));
    await stub.fetch('https://internal/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        arena: p1.arena || 'Default',
        startingHealth: p1.startingHealth || 100,
        p1: { userId: p1.userId, username: p1.username, ballType: p1.ballType },
        p2: { userId: p2.userId, username: p2.username, ballType: p2.ballType },
      }),
    });

    const shared = {
      room: roomId,
      roomId,
      arena: p1.arena || 'Default',
      startingHealth: p1.startingHealth || 100,
      hearts: { p1: 3, p2: 3 },
      p1Username: p1.username,
      p2Username: p2.username,
      p1Info: { name: p1.username, username: p1.username, ballType: p1.ballType },
      p2Info: { name: p2.username, username: p2.username, ballType: p2.ballType },
    };

    sendWs(p1.socket, 'match_found', {
      ...shared,
      role: 'Player 1',
      playerRole: 'p1',
      side: 'left',
      playerNumber: 1,
    });
    sendWs(p2.socket, 'match_found', {
      ...shared,
      role: 'Player 2',
      playerRole: 'p2',
      side: 'right',
      playerNumber: 2,
    });
  }

  private async handleMessage(player: QueuedPlayer, raw: string): Promise<void> {
    let msg: WsEnvelope<Record<string, unknown>>;
    try {
      msg = JSON.parse(raw) as WsEnvelope<Record<string, unknown>>;
    } catch {
      return;
    }

    if (msg.type === 'ping_check') {
      sendWs(player.socket, 'pong_check', msg.payload, msg.requestId);
      return;
    }

    if (msg.type === 'queue_join' || msg.type === 'join_match') {
      if (typeof msg.payload?.username === 'string' && msg.payload.username.trim()) {
        player.username = msg.payload.username.trim().slice(0, 12);
      }
      if (typeof msg.payload?.ballType === 'string' && msg.payload.ballType.trim()) {
        player.ballType = msg.payload.ballType.trim();
      }
      if (typeof msg.payload?.arena === 'string' && msg.payload.arena.trim()) {
        player.arena = msg.payload.arena.trim();
      }
      if (Number.isFinite(Number(msg.payload?.startingHealth))) {
        player.startingHealth = clamp(Number(msg.payload?.startingHealth), 50, 200);
      }
      this.enqueuePlayer(player);
      return;
    }

    if (msg.type === 'create_custom_lobby') {
      const roomId = typeof msg.payload?.roomId === 'string' ? msg.payload.roomId.trim() : '';
      if (!roomId || this.customRooms.has(roomId)) {
        sendWs(player.socket, 'lobby_error', 'Room name taken');
        return;
      }

      this.removePlayer(player);
      if (typeof msg.payload?.username === 'string' && msg.payload.username.trim()) {
        player.username = msg.payload.username.trim().slice(0, 12);
      }
      if (typeof msg.payload?.ballType === 'string' && msg.payload.ballType.trim()) {
        player.ballType = msg.payload.ballType.trim();
      }
      if (typeof msg.payload?.arena === 'string' && msg.payload.arena.trim()) {
        player.arena = msg.payload.arena.trim();
      }
      if (Number.isFinite(Number(msg.payload?.startingHealth))) {
        player.startingHealth = clamp(Number(msg.payload?.startingHealth), 50, 200);
      }

      const password = typeof msg.payload?.password === 'string' ? msg.payload.password : '';
      this.customRooms.set(roomId, { roomId, password, host: player });
      sendWs(player.socket, 'lobby_created', { roomId });
      return;
    }

    if (msg.type === 'join_custom_lobby') {
      const roomId = typeof msg.payload?.roomId === 'string' ? msg.payload.roomId.trim() : '';
      const lobby = this.customRooms.get(roomId);
      if (!lobby || lobby.host.socket.readyState !== 1) {
        if (lobby) this.customRooms.delete(roomId);
        sendWs(player.socket, 'lobby_error', 'Room not found');
        return;
      }

      const providedPassword = typeof msg.payload?.password === 'string' ? msg.payload.password : '';
      if (lobby.password !== providedPassword) {
        sendWs(player.socket, 'lobby_error', 'Incorrect password');
        return;
      }

      if (typeof msg.payload?.username === 'string' && msg.payload.username.trim()) {
        player.username = msg.payload.username.trim().slice(0, 12);
      }
      if (typeof msg.payload?.ballType === 'string' && msg.payload.ballType.trim()) {
        player.ballType = msg.payload.ballType.trim();
      }

      this.customRooms.delete(roomId);
      this.waitingQueue = this.waitingQueue.filter(
        (p) => p.socket !== player.socket && p.socket !== lobby.host.socket
      );
      await this.pairPlayersIntoGameRoom(roomId, lobby.host, player);
    }
  }
}

// ============================================================================
// DURABLE OBJECT 2: AUTHORITATIVE GAME ROOM DO (30Hz Physics + 3-Heart Drafts)
// ============================================================================
interface RoomBallPhysics {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  health: number;
  maxHealth: number;
  hitbox: number;
  parryActive: boolean;
  dodgeActive: boolean;
  isDead: boolean;
  launchAngle: number;
  launchLocked: boolean;
  abilityProgress?: number;
  abilityRemaining?: number;
  abilityActive?: boolean;
  abilityStatusText?: string;
}

interface RoomPlayerSlot {
  side: 'p1' | 'p2';
  role: 'Player 1' | 'Player 2';
  userId: string;
  username: string;
  ballType: string;
  socket: WorkerWebSocket | null;
  readyForRematch: boolean;
  ball: RoomBallPhysics;
}

export class GameRoomDO {
  private env: Env;
  private roomId = '';
  private arena = 'Default';
  private startingHealth = 100;
  private roundNumber = 1;
  private roundTimer = 0;
  private phase: 'DRAFT' | 'LAUNCH' | 'PLAYING' | 'FINISHER' | 'MATCH_OVER' = 'DRAFT';
  private hearts = { p1: 3, p2: 3 };
  private drafts: { p1: string | null; p2: string | null } = { p1: null, p2: null };
  private roundLossProcessed = false;
  private matchRewardsProcessed = false;
  private physicsIntervalId: ReturnType<typeof setInterval> | null = null;
  private p1: RoomPlayerSlot | null = null;
  private p2: RoomPlayerSlot | null = null;

  constructor(_state: WorkerDurableObjectState, env: Env) {
    this.env = env;
  }

  private createInitialBall(side: 'p1' | 'p2', maxHp: number): RoomBallPhysics {
    const spawnX =
      side === 'p1'
        ? ARENA_INNER_LEFT + ARENA_SIZE * 0.22
        : ARENA_INNER_RIGHT - ARENA_SIZE * 0.22;
    const spawnY = ARENA_INNER_TOP + (ARENA_INNER_BOTTOM - ARENA_INNER_TOP) * 0.5;
    return {
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      mass: BALL_MASS,
      health: maxHp,
      maxHealth: maxHp,
      hitbox: BALL_RADIUS,
      parryActive: false,
      dodgeActive: false,
      isDead: false,
      launchAngle: side === 'p1' ? 0 : Math.PI,
      launchLocked: false,
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Internal setup call from MatchmakerDO
    if (url.pathname === '/init' && request.method === 'POST') {
      const data = (await request.json()) as {
        roomId: string;
        arena?: string;
        startingHealth?: number;
        p1: { userId: string; username: string; ballType: string };
        p2: { userId: string; username: string; ballType: string };
      };

      this.stopPhysicsLoop();
      this.roomId = data.roomId;
      this.arena = data.arena || 'Default';
      this.startingHealth = clamp(Number(data.startingHealth) || 100, 50, 200);
      this.roundNumber = 1;
      this.roundTimer = 0;
      this.phase = 'DRAFT';
      this.hearts = { p1: 3, p2: 3 };
      this.drafts = { p1: null, p2: null };
      this.roundLossProcessed = false;
      this.matchRewardsProcessed = false;

      this.p1 = {
        side: 'p1',
        role: 'Player 1',
        userId: data.p1.userId,
        username: data.p1.username || 'Player 1',
        ballType: data.p1.ballType || 'quadblade',
        socket: null,
        readyForRematch: false,
        ball: this.createInitialBall('p1', this.startingHealth),
      };
      this.p2 = {
        side: 'p2',
        role: 'Player 2',
        userId: data.p2.userId,
        username: data.p2.username || 'Player 2',
        ballType: data.p2.ballType || 'blackhole',
        socket: null,
        readyForRematch: false,
        ball: this.createInitialBall('p2', this.startingHealth),
      };
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const userId = request.headers.get('X-User-Id') || '';
    const username = request.headers.get('X-Username') || 'Fighter';
    const roomIdHeader = request.headers.get('X-Room-Id') || this.roomId || 'room';
    if (!this.roomId) this.roomId = roomIdHeader;

    const slot = this.assignPlayerSlot(userId, username);
    if (!slot) {
      return new Response('Room is full', { status: 403 });
    }

    const pair = createWebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    if (slot.socket && slot.socket !== server && slot.socket.readyState === 1) {
      try {
        slot.socket.close(1000, 'Replaced by new connection');
      } catch {
        // Ignore close errors
      }
    }
    slot.socket = server;

    // Push authoritative wallet balance immediately upon room join
    void this.pushWalletToSlot(slot);

    server.addEventListener('message', (event: MessageEvent) => {
      void this.handleClientMessage(slot, String(event.data));
    });

    server.addEventListener('close', () => {
      void this.handleDisconnect(slot, server);
    });

    server.addEventListener('error', () => {
      void this.handleDisconnect(slot, server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    } as ResponseInit & { webSocket: WebSocket });
  }

  private assignPlayerSlot(userId: string, username: string): RoomPlayerSlot | null {
    if (this.p1 && this.p1.userId === userId) return this.p1;
    if (this.p2 && this.p2.userId === userId) return this.p2;

    if (!this.p1) {
      this.p1 = {
        side: 'p1',
        role: 'Player 1',
        userId,
        username,
        ballType: 'quadblade',
        socket: null,
        readyForRematch: false,
        ball: this.createInitialBall('p1', this.startingHealth),
      };
      return this.p1;
    }
    if (!this.p2) {
      this.p2 = {
        side: 'p2',
        role: 'Player 2',
        userId,
        username,
        ballType: 'blackhole',
        socket: null,
        readyForRematch: false,
        ball: this.createInitialBall('p2', this.startingHealth),
      };
      return this.p2;
    }
    return null;
  }

  private async pushWalletToSlot(slot: RoomPlayerSlot): Promise<void> {
    if (!slot.userId) return;
    const row = await findUserById(this.env.DB, slot.userId);
    if (!row || !slot.socket) return;
    const pub = toPublicUser(row);
    sendWs(slot.socket, 'wallet_updated', pub.coins);
    sendWs(slot.socket, 'unlocked_balls_updated', pub.unlockedBalls);
  }

  private broadcast(type: string, payload?: unknown): void {
    sendWs(this.p1?.socket, type, payload);
    sendWs(this.p2?.socket, type, payload);
  }

  private getOpponentSlot(slot: RoomPlayerSlot): RoomPlayerSlot | null {
    return slot.side === 'p1' ? this.p2 : this.p1;
  }

  private startPhysicsLoop(): void {
    this.stopPhysicsLoop();
    this.physicsIntervalId = setInterval(() => {
      this.stepPhysicsTick();
    }, TICK_MS);
  }

  private stopPhysicsLoop(): void {
    if (this.physicsIntervalId !== null) {
      clearInterval(this.physicsIntervalId);
      this.physicsIntervalId = null;
    }
  }

  // ==========================================================================
  // 30Hz AUTHORITATIVE PHYSICS LOOP (Momentum, Arena Walls, Collisions, HP)
  // Broadcasts state to all connected clients via server.send(JSON.stringify(data))
  // ==========================================================================
  private stepPhysicsTick(): void {
    if (this.phase !== 'PLAYING' || !this.p1 || !this.p2) return;

    const dt = 1 / TICK_HZ;
    this.roundTimer += dt;
    const timeScale = this.roundTimer >= 10.0 ? 2.0 : 1.0;
    const isSuddenDeath = this.roundTimer >= 15.0;
    const stepScale = dt * 60 * timeScale;

    const friction =
      this.arena === 'Ice'
        ? 0.9998
        : this.arena === 'Road'
        ? 0.9968
        : isSuddenDeath
        ? 1.0
        : BASE_FRICTION;

    const speedCap = (isSuddenDeath ? NORMAL_BASE_SPEED * 1.5 : NORMAL_BASE_SPEED);
    const speedMin = NORMAL_MIN_SPEED;

    const b1 = this.p1.ball;
    const b2 = this.p2.ball;

    const integrateBall = (b: RoomBallPhysics) => {
      if (b.isDead) return;
      b.x += b.vx * stepScale;
      b.y += b.vy * stepScale;

      const frameFriction = Math.pow(friction, stepScale);
      b.vx *= frameFriction;
      b.vy *= frameFriction;

      // Wall collisions inside the 620x620 arena interior
      if (b.x - b.radius < ARENA_INNER_LEFT) {
        b.x = ARENA_INNER_LEFT + b.radius;
        b.vx = Math.abs(b.vx);
      } else if (b.x + b.radius > ARENA_INNER_RIGHT) {
        b.x = ARENA_INNER_RIGHT - b.radius;
        b.vx = -Math.abs(b.vx);
      }

      if (b.y - b.radius < ARENA_INNER_TOP) {
        b.y = ARENA_INNER_TOP + b.radius;
        b.vy = Math.abs(b.vy);
      } else if (b.y + b.radius > ARENA_INNER_BOTTOM) {
        b.y = ARENA_INNER_BOTTOM - b.radius;
        b.vy = -Math.abs(b.vy);
      }

      const speed = Math.hypot(b.vx, b.vy);
      if (speed > speedCap) {
        b.vx = (b.vx / speed) * speedCap;
        b.vy = (b.vy / speed) * speedCap;
      } else if (speed < speedMin && speed > 0.05) {
        b.vx = (b.vx / speed) * speedMin;
        b.vy = (b.vy / speed) * speedMin;
      }
    };

    integrateBall(b1);
    integrateBall(b2);

    // Ball-to-Ball Authoritative Elastic Collision & Damage
    if (!b1.isDead && !b2.isDead) {
      const dx = b2.x - b1.x;
      const dy = b2.y - b1.y;
      const dist = Math.hypot(dx, dy);
      const minDist = b1.radius + b2.radius;

      if (dist > 0 && dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        const tx = -ny;
        const ty = nx;

        const overlap = minDist - dist;
        const totalMass = b1.mass + b2.mass;
        b1.x -= nx * overlap * (b2.mass / totalMass);
        b1.y -= ny * overlap * (b2.mass / totalMass);
        b2.x += nx * overlap * (b1.mass / totalMass);
        b2.y += ny * overlap * (b1.mass / totalMass);

        const v1n = b1.vx * nx + b1.vy * ny;
        const v1t = b1.vx * tx + b1.vy * ty;
        const v2n = b2.vx * nx + b2.vy * ny;
        const v2t = b2.vx * tx + b2.vy * ty;

        const relativeImpactSpeed = Math.hypot(b1.vx - b2.vx, b1.vy - b2.vy);

        if (v1n - v2n > 0) {
          const restitution = 0.96;
          const v1nPost = ((v1n * (b1.mass - b2.mass) + 2 * b2.mass * v2n) / totalMass) * restitution;
          const v2nPost = ((v2n * (b2.mass - b1.mass) + 2 * b1.mass * v1n) / totalMass) * restitution;

          b1.vx = v1nPost * nx + v1t * tx;
          b1.vy = v1nPost * ny + v1t * ty;
          b2.vx = v2nPost * nx + v2t * tx;
          b2.vy = v2nPost * ny + v2t * ty;

          const damp = (b: RoomBallPhysics) => {
            const s = Math.hypot(b.vx, b.vy);
            if (s > 15.0) {
              const target = 15.0 + (s - 15.0) * 0.74;
              b.vx *= target / s;
              b.vy *= target / s;
            }
          };
          damp(b1);
          damp(b2);

          if (relativeImpactSpeed > 0.8) {
            const damageMult = isSuddenDeath ? 2.0 : 1.0;
            const dmgToP2 = b2.dodgeActive || b2.parryActive ? 0 : relativeImpactSpeed * 1.5 * damageMult;
            const dmgToP1 = b1.dodgeActive || b1.parryActive ? 0 : relativeImpactSpeed * 1.5 * damageMult;

            // Slight speed-favoring exchange so faster striker hits harder
            const s1 = Math.hypot(b1.vx, b1.vy);
            const s2 = Math.hypot(b2.vx, b2.vy);
            if (s1 >= s2) {
              b2.health = Math.max(0, b2.health - dmgToP2);
              b1.health = Math.max(0, b1.health - dmgToP1 * 0.45);
            } else {
              b1.health = Math.max(0, b1.health - dmgToP1);
              b2.health = Math.max(0, b2.health - dmgToP2 * 0.45);
            }
          }
        }
      }
    }

    if (b1.health <= 0) b1.isDead = true;
    if (b2.health <= 0) b2.isDead = true;

    const snapshot = {
      roundTimer: this.roundTimer,
      serverTime: Date.now(),
      p1: {
        x: b1.x,
        y: b1.y,
        vx: b1.vx,
        vy: b1.vy,
        health: b1.health,
        hitbox: b1.hitbox,
        parryActive: b1.parryActive,
        dodgeActive: b1.dodgeActive,
        isDead: b1.isDead,
        abilityProgress: b1.abilityProgress,
        abilityRemaining: b1.abilityRemaining,
        abilityActive: b1.abilityActive,
        abilityStatusText: b1.abilityStatusText,
      },
      p2: {
        x: b2.x,
        y: b2.y,
        vx: b2.vx,
        vy: b2.vy,
        health: b2.health,
        hitbox: b2.hitbox,
        parryActive: b2.parryActive,
        dodgeActive: b2.dodgeActive,
        isDead: b2.isDead,
        abilityProgress: b2.abilityProgress,
        abilityRemaining: b2.abilityRemaining,
        abilityActive: b2.abilityActive,
        abilityStatusText: b2.abilityStatusText,
      },
    };

    // Broadcast authoritative 30Hz state to Player 1 and Player 2
    const packet = JSON.stringify({ type: 'game_state', payload: snapshot });
    if (this.p1.socket?.readyState === 1) {
      this.p1.socket.send(packet);
    }
    if (this.p2.socket?.readyState === 1) {
      this.p2.socket.send(packet);
    }

    if (b1.isDead || b2.isDead) {
      this.phase = 'FINISHER';
      this.stopPhysicsLoop();
    }
  }

  private async processMatchRewardsInD1(winnerSide: 'p1' | 'p2'): Promise<void> {
    if (this.matchRewardsProcessed || !this.p1 || !this.p2) return;
    this.matchRewardsProcessed = true;

    const winnerSlot = winnerSide === 'p1' ? this.p1 : this.p2;
    const loserSlot = winnerSide === 'p1' ? this.p2 : this.p1;

    if (winnerSlot.userId) {
      const updatedWinner = await incrementUserCoinsInD1(
        this.env.DB,
        winnerSlot.userId,
        WINNER_COIN_REWARD
      );
      if (updatedWinner && winnerSlot.socket) {
        sendWs(winnerSlot.socket, 'wallet_updated', updatedWinner.coins);
        sendWs(winnerSlot.socket, 'unlocked_balls_updated', updatedWinner.unlockedBalls);
      }
    }

    if (loserSlot.userId) {
      const updatedLoser = await incrementUserCoinsInD1(
        this.env.DB,
        loserSlot.userId,
        LOSER_COIN_REWARD
      );
      if (updatedLoser && loserSlot.socket) {
        sendWs(loserSlot.socket, 'wallet_updated', updatedLoser.coins);
        sendWs(loserSlot.socket, 'unlocked_balls_updated', updatedLoser.unlockedBalls);
      }
    }
  }

  private async handleDisconnect(slot: RoomPlayerSlot, closedSocket: WorkerWebSocket): Promise<void> {
    if (slot.socket !== closedSocket) return;
    slot.socket = null;

    const opponent = this.getOpponentSlot(slot);
    if (!opponent) {
      this.stopPhysicsLoop();
      return;
    }

    if (!this.matchRewardsProcessed && this.phase !== 'MATCH_OVER') {
      await this.processMatchRewardsInD1(opponent.side);
    }

    this.phase = 'MATCH_OVER';
    this.stopPhysicsLoop();
    sendWs(opponent.socket, 'opponent_disconnected', { room: this.roomId });
  }

  private async handleClientMessage(slot: RoomPlayerSlot, raw: string): Promise<void> {
    let msg: WsEnvelope<Record<string, unknown>>;
    try {
      msg = JSON.parse(raw) as WsEnvelope<Record<string, unknown>>;
    } catch {
      return;
    }

    const opponent = this.getOpponentSlot(slot);

    switch (msg.type) {
      case 'ping_check': {
        sendWs(slot.socket, 'pong_check', msg.payload, msg.requestId);
        return;
      }

      case 'purchase_character': {
        const charId = String(msg.payload?.characterId || msg.payload?.ballId || '').trim();
        const cost = getAuthoritativeCharacterCost(charId);
        const result = await purchaseCharacterInD1(this.env.DB, slot.userId, charId, cost);
        if (!result.ok || !result.user) {
          sendWs(slot.socket, 'purchase_error', { characterId: charId, error: result.error }, msg.requestId);
          return;
        }
        sendWs(slot.socket, 'wallet_updated', result.user.coins, msg.requestId);
        sendWs(slot.socket, 'unlocked_balls_updated', result.user.unlockedBalls);
        sendWs(slot.socket, 'purchase_success', {
          ok: true,
          coins: result.user.coins,
          unlockedBalls: result.user.unlockedBalls,
        }, msg.requestId);
        return;
      }

      case 'reroll_draft': {
        const result = await rerollDraftInD1(this.env.DB, slot.userId);
        if (!result.ok || !result.user) {
          sendWs(slot.socket, 'purchase_error', { error: result.error }, msg.requestId);
          return;
        }
        sendWs(slot.socket, 'wallet_updated', result.user.coins, msg.requestId);
        sendWs(slot.socket, 'reroll_success', { ok: true, coins: result.user.coins }, msg.requestId);
        return;
      }

      case 'lock_draft': {
        if (!this.p1 || !this.p2) return;
        const selectedBall = typeof msg.payload?.ballId === 'string' ? msg.payload.ballId.trim() : '';
        if (!selectedBall) return;

        const providedName =
          typeof msg.payload?.username === 'string' && msg.payload.username.trim()
            ? msg.payload.username.trim().slice(0, 12)
            : typeof msg.payload?.name === 'string' && msg.payload.name.trim()
            ? msg.payload.name.trim().slice(0, 12)
            : '';
        if (providedName) slot.username = providedName;
        slot.ballType = selectedBall;

        if (slot.side === 'p1') {
          this.drafts.p1 = selectedBall;
          if (typeof msg.payload?.arena === 'string' && msg.payload.arena.trim()) {
            this.arena = msg.payload.arena.trim();
          }
          if (Number.isFinite(Number(msg.payload?.startingHealth))) {
            this.startingHealth = clamp(Number(msg.payload?.startingHealth), 50, 200);
          }
        } else {
          this.drafts.p2 = selectedBall;
        }

        sendWs(opponent?.socket, 'opponent_draft_locked', {
          roomId: this.roomId,
          playerSide: slot.side,
          ballId: selectedBall,
        });

        if (this.drafts.p1 !== null && this.drafts.p2 !== null) {
          const p1Character = this.drafts.p1;
          const p2Character = this.drafts.p2;
          this.p1.ballType = p1Character;
          this.p2.ballType = p2Character;
          this.p1.ball = this.createInitialBall('p1', this.startingHealth);
          this.p2.ball = this.createInitialBall('p2', this.startingHealth);
          this.phase = 'LAUNCH';
          this.roundLossProcessed = false;
          this.roundTimer = 0;

          this.broadcast('enter_launch_phase', {
            p1Character,
            p2Character,
            room: this.roomId,
            roomId: this.roomId,
            arena: this.arena,
            startingHealth: this.startingHealth,
            hearts: { ...this.hearts },
            roundNumber: this.roundNumber,
            p1Username: this.p1.username,
            p2Username: this.p2.username,
            p1Info: { name: this.p1.username, username: this.p1.username, ballType: p1Character },
            p2Info: { name: this.p2.username, username: this.p2.username, ballType: p2Character },
          });

          this.drafts = { p1: null, p2: null };
        }
        return;
      }

      case 'launch_lock': {
        if (!this.p1 || !this.p2) return;
        const rawAngle = Number(msg.payload?.angle ?? msg.payload?.launchAngle ?? 0);
        const angle = Number.isFinite(rawAngle) ? rawAngle : 0;
        slot.ball.launchAngle = angle;
        slot.ball.launchLocked = true;

        sendWs(opponent?.socket, 'opponent_launch_locked', {
          role: slot.role,
          angle,
        });

        if (this.p1.ball.launchLocked && this.p2.ball.launchLocked && this.phase === 'LAUNCH') {
          const p1Angle = this.p1.ball.launchAngle;
          const p2Angle = this.p2.ball.launchAngle;
          this.p1.ball = this.createInitialBall('p1', this.startingHealth);
          this.p2.ball = this.createInitialBall('p2', this.startingHealth);
          this.p1.ball.launchAngle = p1Angle;
          this.p1.ball.launchLocked = true;
          this.p1.ball.vx = Math.cos(p1Angle) * LAUNCH_SPEED;
          this.p1.ball.vy = Math.sin(p1Angle) * LAUNCH_SPEED;
          this.p2.ball.launchAngle = p2Angle;
          this.p2.ball.launchLocked = true;
          this.p2.ball.vx = Math.cos(p2Angle) * LAUNCH_SPEED;
          this.p2.ball.vy = Math.sin(p2Angle) * LAUNCH_SPEED;

          this.phase = 'PLAYING';
          this.roundTimer = 0;
          this.roundLossProcessed = false;

          this.broadcast('start_round', {
            room: this.roomId,
            roundNumber: this.roundNumber,
            hearts: { ...this.hearts },
            p1Angle: this.p1.ball.launchAngle,
            p2Angle: this.p2.ball.launchAngle,
            serverTime: Date.now(),
          });

          this.startPhysicsLoop();
        }
        return;
      }

      case 'player_state': {
        if (!this.p1 || !this.p2 || this.phase !== 'PLAYING') return;
        const p = msg.payload || {};

        // Update defensive stances & HUD telemetry for authoritative collision rules
        slot.ball.parryActive = Boolean(p.parryActive);
        slot.ball.dodgeActive = Boolean(p.dodgeActive);
        if (Number.isFinite(Number(p.hitbox))) {
          slot.ball.hitbox = clamp(Number(p.hitbox), 16, 140);
        }
        if (Number.isFinite(Number(p.abilityProgress))) {
          slot.ball.abilityProgress = clamp(Number(p.abilityProgress), 0, 1);
        }
        if (Number.isFinite(Number(p.abilityRemaining))) {
          slot.ball.abilityRemaining = clamp(Number(p.abilityRemaining), 0, 30);
        }
        if (typeof p.abilityActive === 'boolean') {
          slot.ball.abilityActive = p.abilityActive;
        }
        if (typeof p.abilityStatusText === 'string') {
          slot.ball.abilityStatusText = p.abilityStatusText.slice(0, 12);
        }

        // Apply bounded special ability damage reported against opponent (e.g. projectiles/slashes)
        if (opponent && Number.isFinite(Number(p.abilityDamageDelta)) && Number(p.abilityDamageDelta) > 0) {
          const boundedDmg = clamp(Number(p.abilityDamageDelta), 0, 35);
          opponent.ball.health = Math.max(0, opponent.ball.health - boundedDmg);
          if (opponent.ball.health <= 0) {
            opponent.ball.isDead = true;
          }
        }

        // Relay ability visual telemetry directly to opponent for smooth local VFX
        sendWs(opponent?.socket, 'opponent_state', {
          x: slot.ball.x,
          y: slot.ball.y,
          vx: slot.ball.vx,
          vy: slot.ball.vy,
          health: slot.ball.health,
          hitbox: slot.ball.hitbox,
          parryActive: slot.ball.parryActive,
          dodgeActive: slot.ball.dodgeActive,
          isDead: slot.ball.isDead,
          abilityProgress: slot.ball.abilityProgress,
          abilityRemaining: slot.ball.abilityRemaining,
          abilityActive: slot.ball.abilityActive,
          abilityStatusText: slot.ball.abilityStatusText,
          timestamp: Date.now(),
        });
        return;
      }

      case 'round_lost': {
        if (!this.p1 || !this.p2 || this.roundLossProcessed) return;
        this.roundLossProcessed = true;
        this.stopPhysicsLoop();

        const rawSide = typeof msg.payload?.loserSide === 'string' ? msg.payload.loserSide.trim().toLowerCase() : '';
        const loserSide: 'p1' | 'p2' =
          rawSide === 'p1' || rawSide === 'left' || rawSide === 'player 1'
            ? 'p1'
            : rawSide === 'p2' || rawSide === 'right' || rawSide === 'player 2'
            ? 'p2'
            : slot.side;
        const winnerSide: 'p1' | 'p2' = loserSide === 'p1' ? 'p2' : 'p1';

        this.hearts[loserSide] = Math.max(0, this.hearts[loserSide] - 1);

        if (this.hearts[loserSide] > 0) {
          this.drafts = { p1: null, p2: null };
          this.p1.ball = this.createInitialBall('p1', this.startingHealth);
          this.p2.ball = this.createInitialBall('p2', this.startingHealth);
          this.phase = 'DRAFT';
          this.roundNumber += 1;
          this.roundTimer = 0;

          this.broadcast('start_new_draft', {
            roomId: this.roomId,
            room: this.roomId,
            hearts: { ...this.hearts },
            loserSide,
            winnerSide,
            roundNumber: this.roundNumber,
          });
        } else {
          this.phase = 'MATCH_OVER';
          const winnerRole: 'Player 1' | 'Player 2' = winnerSide === 'p1' ? 'Player 1' : 'Player 2';
          const winnerUsername = winnerSide === 'p1' ? this.p1.username : this.p2.username;

          this.broadcast('match_over', {
            roomId: this.roomId,
            room: this.roomId,
            hearts: { ...this.hearts },
            loserSide,
            winnerSide,
            winnerRole,
            winnerUsername,
          });

          await this.processMatchRewardsInD1(winnerSide);
        }
        return;
      }

      case 'request_rematch': {
        if (!this.p1 || !this.p2) return;
        slot.readyForRematch = true;
        if (this.p1.readyForRematch && this.p2.readyForRematch) {
          this.p1.readyForRematch = false;
          this.p2.readyForRematch = false;
          this.hearts = { p1: 3, p2: 3 };
          this.roundNumber = 1;
          this.roundTimer = 0;
          this.roundLossProcessed = false;
          this.matchRewardsProcessed = false;
          this.phase = 'LAUNCH';
          this.p1.ball = this.createInitialBall('p1', this.startingHealth);
          this.p2.ball = this.createInitialBall('p2', this.startingHealth);
          this.broadcast('rematch_started', {
            room: this.roomId,
            hearts: { ...this.hearts },
          });
        } else {
          sendWs(opponent?.socket, 'opponent_rematch_ready', { role: slot.role });
        }
        return;
      }

      case 'chat_message': {
        const text = typeof msg.payload?.text === 'string' ? msg.payload.text.slice(0, 160) : '';
        if (text.trim()) {
          sendWs(opponent?.socket, 'opponent_chat', {
            text,
            senderName: slot.username,
            senderRole: slot.role,
          });
        }
        return;
      }

      case 'tactical_ping': {
        const x = Number.isFinite(Number(msg.payload?.x))
          ? clamp(Number(msg.payload?.x), ARENA_INNER_LEFT + 20, ARENA_INNER_RIGHT - 20)
          : CANVAS_W / 2;
        const y = Number.isFinite(Number(msg.payload?.y))
          ? clamp(Number(msg.payload?.y), ARENA_INNER_TOP + 20, ARENA_INNER_BOTTOM - 20)
          : CANVAS_H / 2;
        sendWs(opponent?.socket, 'opponent_ping', {
          x,
          y,
          sector: typeof msg.payload?.sector === 'string' ? msg.payload.sector.slice(0, 24) : 'ARENA',
          color: typeof msg.payload?.color === 'string' ? msg.payload.color.slice(0, 24) : '#f97316',
          senderName: slot.username,
          senderRole: slot.role,
        });
        return;
      }

      case 'player_emote': {
        const emoteId = typeof msg.payload?.emoteId === 'string' ? msg.payload.emoteId.slice(0, 24) : 'gg';
        sendWs(opponent?.socket, 'opponent_emote', {
          emoteId,
          senderName: slot.username,
          senderRole: slot.role,
        });
      }
    }
  }
}
