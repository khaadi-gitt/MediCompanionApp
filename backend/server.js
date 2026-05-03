const http = require('http');
const fs = require('fs');
const path = require('path');

loadEnvFile(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT || 5050);
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

const MEDICAL_KEYWORDS = [
  'health',
  'medical',
  'doctor',
  'medicine',
  'symptom',
  'disease',
  'pain',
  'fever',
  'headache',
  'cough',
  'cold',
  'vomit',
  'nausea',
  'diabetes',
  'blood pressure',
  'bp',
  'heart',
  'liver',
  'kidney',
  'infection',
  'allergy',
  'asthma',
  'rash',
  'skin',
  'stomach',
  'pregnancy',
  'tablet',
  'drug',
  'treatment',
];

const COMMON_SYMPTOMS = [
  'Headache',
  'Fever',
  'Cough / Flu',
  'Stomach pain',
  'Skin rash',
  'Diabetes concern',
  'Blood pressure',
];

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && requestUrl.pathname === '/health') {
    json(res, 200, { ok: true, service: 'medicompanion-api' });
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/admin/config') {
    if (!isAdmin(req)) {
      json(res, 401, { error: 'Unauthorized admin request.' });
      return;
    }

    try {
      const cfg = await getRuntimeConfig();
      json(res, 200, {
        openai_enabled: cfg.openai_enabled,
        openai_model: cfg.openai_model,
        openai_api_key_masked: maskKey(cfg.openai_api_key),
        updated_at: cfg.updated_at,
      });
    } catch (error) {
      json(res, 500, { error: error.message || 'Could not read config.' });
    }
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/admin/config') {
    if (!isAdmin(req)) {
      json(res, 401, { error: 'Unauthorized admin request.' });
      return;
    }

    try {
      const body = await readJson(req);

      const patch = {};
      if (typeof body.openai_enabled === 'boolean') patch.openai_enabled = body.openai_enabled;
      if (typeof body.openai_model === 'string' && body.openai_model.trim()) patch.openai_model = body.openai_model.trim();
      if (typeof body.openai_api_key === 'string' && body.openai_api_key.trim()) patch.openai_api_key = body.openai_api_key.trim();

      if (Object.keys(patch).length === 0) {
        json(res, 400, { error: 'No valid fields to update.' });
        return;
      }

      const updated = await updateRuntimeConfig(patch);
      json(res, 200, {
        ok: true,
        openai_enabled: updated.openai_enabled,
        openai_model: updated.openai_model,
        openai_api_key_masked: maskKey(updated.openai_api_key),
        updated_at: updated.updated_at,
      });
    } catch (error) {
      json(res, 500, { error: error.message || 'Could not update config.' });
    }
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/chat') {
    try {
      const body = await readJson(req);
      const message = String(body?.message || '').trim();
      const history = Array.isArray(body?.history) ? body.history : [];

      if (!message) {
        json(res, 400, { error: 'Message is required.' });
        return;
      }

      if (!looksMedical(message)) {
        const choices = COMMON_SYMPTOMS.map((x) => `- ${x}`).join('\n');
        json(res, 200, {
          blocked: true,
          reply:
            'I can only handle medical and health questions. Please choose a symptom first:\n' +
            choices,
        });
        return;
      }

      const runtimeCfg = await getRuntimeConfig();

      if (!runtimeCfg.openai_enabled) {
        json(res, 200, {
          blocked: true,
          reply: 'Chat is temporarily disabled. Please ask the admin to enable AI chat.',
        });
        return;
      }

      if (!runtimeCfg.openai_api_key) {
        json(res, 500, {
          error: 'OpenAI key missing in app_config table.',
        });
        return;
      }

      const messages = [
        {
          role: 'system',
          content:
            'You are MediCompanion, a medical education assistant. Only answer medical/health topics. Keep answers simple, clear, and short. Never provide diagnosis certainty or prescription dosage. If urgent red flags appear, advise immediate doctor/ER visit. Always end with this exact disclaimer: "This information is for educational purposes only and is not a substitute for professional medical advice."',
        },
        ...history
          .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.text })),
        { role: 'user', content: message },
      ];

      const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${runtimeCfg.openai_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: runtimeCfg.openai_model || 'gpt-4o-mini',
          temperature: 0.2,
          messages,
        }),
      });

      if (!openaiResp.ok) {
        const errText = await openaiResp.text();
        json(res, 502, { error: 'OpenAI request failed', detail: errText });
        return;
      }

      const data = await openaiResp.json();
      const reply = data?.choices?.[0]?.message?.content?.trim();

      if (!reply) {
        json(res, 502, { error: 'No response text from model.' });
        return;
      }

      json(res, 200, { blocked: false, reply });
      return;
    } catch (error) {
      json(res, 500, { error: error.message || 'Unexpected server error' });
      return;
    }
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`MediCompanion API running on http://localhost:${PORT}`);
});

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-secret');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
}

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload too large.'));
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

function looksMedical(text) {
  const value = text.toLowerCase();
  return MEDICAL_KEYWORDS.some((k) => value.includes(k));
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  }
}

function isAdmin(req) {
  if (!ADMIN_SECRET) return false;
  const header = String(req.headers['x-admin-secret'] || '').trim();
  return Boolean(header) && header === ADMIN_SECRET;
}

function maskKey(key) {
  const value = String(key || '').trim();
  if (!value) return '';
  if (value.length <= 8) return '****';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

async function getRuntimeConfig() {
  if (!hasSupabaseConfig()) {
    throw new Error('SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY missing in backend/.env');
  }

  const url = `${SUPABASE_URL}/rest/v1/app_config?id=eq.1&select=*`;
  const resp = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!resp.ok) {
    throw new Error(`Supabase config read failed (${resp.status})`);
  }

  const rows = await resp.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('app_config row not found. Run backend/sql/app_config.sql first.');
  }

  return rows[0];
}

async function updateRuntimeConfig(patch) {
  const current = await getRuntimeConfig();
  const next = {
    ...current,
    ...patch,
    id: 1,
    updated_at: new Date().toISOString(),
  };

  const url = `${SUPABASE_URL}/rest/v1/app_config?on_conflict=id`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify([next]),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Supabase config update failed (${resp.status}) ${detail}`);
  }

  const rows = await resp.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : next;
}
