/**
 * 本地开发 API 服务器
 */
import http from 'http';
import { parse } from 'url';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:5174'];

function getCorsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function signTokens(userId) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = crypto.randomUUID();
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await query(
    `INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [userId, refreshTokenHash]
  );
  return { accessToken, refreshToken };
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, data, status = 200, origin = '') {
  res.writeHead(status, { 'Content-Type': 'application/json', ...getCorsHeaders(origin) });
  res.end(JSON.stringify(data));
}

// API handlers
function createHandlers(origin) {
  return {
    'POST /api/auth/register': async (req, res) => {
      const { email, password, nickname } = await parseBody(req);

      if (!email || !password) {
        return sendJSON(res, { error: '邮箱和密码不能为空' }, 400, origin);
      }

      if (password.length < 6) {
        return sendJSON(res, { error: '密码至少需要6个字符' }, 400, origin);
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existing = await queryOne('SELECT id FROM users WHERE email = $1', [normalizedEmail]);

      if (existing) {
        return sendJSON(res, { error: '该邮箱已被注册' }, 409, origin);
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await queryOne(
        `INSERT INTO users (email, password_hash, nickname) VALUES ($1, $2, $3) RETURNING id, email, nickname`,
        [normalizedEmail, passwordHash, nickname?.trim() || normalizedEmail.split('@')[0]]
      );

      if (!user) {
        return sendJSON(res, { error: '创建用户失败' }, 500, origin);
      }

      const tokens = await signTokens(user.id);
      sendJSON(res, { user, ...tokens }, 201, origin);
    },

    'POST /api/auth/login': async (req, res) => {
      const { email, password } = await parseBody(req);

      if (!email || !password) {
        return sendJSON(res, { error: '邮箱和密码不能为空' }, 400, origin);
      }

      const user = await queryOne(
        'SELECT id, email, nickname, password_hash FROM users WHERE email = $1',
        [email.toLowerCase().trim()]
      );

      if (!user || !user.password_hash) {
        return sendJSON(res, { error: '邮箱或密码错误' }, 401, origin);
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return sendJSON(res, { error: '邮箱或密码错误' }, 401, origin);
      }

      const tokens = await signTokens(user.id);
      sendJSON(res, { user: { id: user.id, email: user.email, nickname: user.nickname }, ...tokens }, 200, origin);
    },

    'POST /api/auth/logout': async (req, res) => {
      sendJSON(res, { message: '登出成功' }, 200, origin);
    },

    'GET /api/auth/me': async (req, res) => {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return sendJSON(res, { error: 'Unauthorized' }, 401, origin);
      }

      const token = authHeader.slice(7);
      const payload = verifyAccessToken(token);
      if (!payload) {
        return sendJSON(res, { error: '无效的访问令牌' }, 401, origin);
      }

      const user = await queryOne(
        `SELECT id, email, nickname, avatar_url, writing_preference, export_preset, model_selection, enable_web_search, email_verified FROM users WHERE id = $1`,
        [payload.userId]
      );

      if (!user) {
        return sendJSON(res, { error: '用户不存在' }, 401, origin);
      }

      sendJSON(res, {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        writingPreference: user.writing_preference,
        exportPreset: user.export_preset,
        modelSelection: user.model_selection,
        enableWebSearch: user.enable_web_search,
        emailVerified: user.email_verified,
      }, 200, origin);
    },
  };
}

// Server
const server = http.createServer(async (req, res) => {
  const url = parse(req.url || '', true);
  const method = req.method || 'GET';
  const origin = req.headers.origin || '';

  if (method === 'OPTIONS') {
    res.writeHead(200, getCorsHeaders(origin));
    return res.end();
  }

  console.log(`${method} ${url.pathname}`);

  const handlers = createHandlers(origin);
  const key = `${method} ${url.pathname}`;
  const handler = handlers[key];

  if (handler) {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('Handler error:', err);
      sendJSON(res, { error: '服务器错误' }, 500, origin);
    }
  } else {
    sendJSON(res, { error: 'Not Found' }, 404, origin);
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 API Server running at http://localhost:${PORT}`);
  console.log(`📡 Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`📡 Available endpoints:`);
  Object.keys(createHandlers('')).forEach((key) => console.log(`   ${key}`));
  console.log('');
});