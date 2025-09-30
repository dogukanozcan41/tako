import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const SESSION_COOKIE = 'tako_session';
const SESSION_MAX_AGE = 1000 * 60 * 60 * 4;

const sessionStore = new Map();

const USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    fullName: 'Tako Admin',
    role: 'Yönetici',
  },
  {
    id: '2',
    username: 'operator',
    password: 'operator123',
    fullName: 'Operasyon Uzmanı',
    role: 'Operatör',
  },
];

const overviewMetrics = [
  { label: 'Açık Hasar', value: '32', delta: '+4 bugün' },
  { label: 'Onarımda Araç', value: '18', delta: '+2 hafta' },
  { label: 'Bekleyen Dosya', value: '9', delta: '-3 hafta' },
  { label: 'Memnuniyet Skoru', value: '92', delta: '+5 puan' },
];

const damageItems = Array.from({ length: 10 }).map((_, index) => {
  const statuses = ['İncelemede', 'Beklemede', 'Tamamlandi'];
  const stages = ['Ekspertiz', 'Parça Bekliyor', 'Teslim'];
  const status = statuses[index % statuses.length];
  return {
    reference: `HK-${202400 + index}`,
    model: ['Model X', 'Model Y', 'Model S'][index % 3],
    status,
    stage: stages[index % stages.length],
    date: new Date(Date.now() - index * 86400000).toISOString(),
  };
});

const activityEvents = Array.from({ length: 12 }).map((_, index) => ({
  time: new Date(Date.now() - index * 3600000)
    .toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', '.'),
  title: ['Ekspertiz Tamamlandı', 'Müşteri Bilgilendirildi', 'Parça Teslim Alındı'][
    index % 3
  ],
  meta: `${['operator', 'admin'][index % 2]} kullanıcısı tarafından güncellendi`,
}));

function createSession(user) {
  const token = `sess_${Math.random().toString(36).slice(2)}`;
  sessionStore.set(token, { user, createdAt: Date.now() });
  return token;
}

function getSession(token) {
  if (!token) return null;
  const session = sessionStore.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_MAX_AGE) {
    sessionStore.delete(token);
    return null;
  }
  return session;
}

function destroySession(token) {
  if (!token) return;
  sessionStore.delete(token);
}

function parseCookies(header = '') {
  return header
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce((acc, cookie) => {
      const [name, ...rest] = cookie.split('=');
      acc[name] = decodeURIComponent(rest.join('='));
      return acc;
    }, {});
}

async function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...headers,
  });
  res.end(body);
}

function sendText(res, statusCode, text, headers = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    ...headers,
  });
  res.end(text);
}

function sendFile(res, filePath) {
  return readFile(filePath)
    .then((content) => {
      res.writeHead(200, {
        'Content-Type': getMimeType(filePath),
        'Content-Length': content.length,
      });
      res.end(content);
    })
    .catch(() => sendNotFound(res));
}

function sendNotFound(res) {
  sendJson(res, 404, { message: 'Kaynak bulunamadı' });
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.json':
      return 'application/json; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

async function handleApiRequest(req, res, url) {
  const cookies = parseCookies(req.headers.cookie ?? '');
  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const rawBody = await readRequestBody(req);
    let payload = {};
    try {
      payload = JSON.parse(rawBody || '{}');
    } catch (error) {
      return sendJson(res, 400, { message: 'Geçersiz JSON' });
    }

    const { username, password } = payload;
    if (!username || !password) {
      return sendJson(res, 400, { message: 'Kullanıcı adı ve parola zorunludur.' });
    }

    const user = USERS.find((item) => item.username === username && item.password === password);
    if (!user) {
      return sendJson(res, 401, { message: 'Kullanıcı adı veya şifre hatalı.' });
    }

    const token = createSession({ id: user.id, fullName: user.fullName, role: user.role });
    sendJson(
      res,
      200,
      { user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role } },
      {
        'Set-Cookie': `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Max-Age=${
          SESSION_MAX_AGE / 1000
        }`,
      }
    );
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    destroySession(cookies[SESSION_COOKIE]);
    sendText(res, 204, '', {
      'Set-Cookie': `${SESSION_COOKIE}=; Max-Age=0; SameSite=Lax`,
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/auth/session') {
    const session = getSession(cookies[SESSION_COOKIE]);
    if (!session) {
      return sendJson(res, 401, { message: 'Oturum bulunamadı' });
    }
    sendJson(res, 200, { user: session.user });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/dashboard/overview') {
    sendJson(res, 200, { metrics: overviewMetrics });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/dashboard/damages') {
    sendJson(res, 200, { items: damageItems });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/dashboard/activity') {
    sendJson(res, 200, { events: activityEvents });
    return;
  }

  sendNotFound(res);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith('/api/')) {
      await handleApiRequest(req, res, url);
      return;
    }

    const requestedPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    let filePath = path.join(PUBLIC_DIR, requestedPath);

    try {
      const fileStat = await stat(filePath);
      if (fileStat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      await sendFile(res, filePath);
    } catch (error) {
      await sendFile(res, path.join(PUBLIC_DIR, 'index.html'));
    }
  } catch (error) {
    sendJson(res, 500, { message: 'Sunucu hatası', detail: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Tako demo sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
});
