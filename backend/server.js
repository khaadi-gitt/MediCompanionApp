const http = require('http');
const fs = require('fs');
const path = require('path');

loadEnvFile(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT || 5050);
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const MIN_TRAINING_EXAMPLES = 8;

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
  'Diabetes',
  'Migraine',
  'Gastro (Stomach)',
];

const ALLOWED_TOPIC_KEYWORDS = {
  diabetes: [
    'diabetes',
    'sugar',
    'blood sugar',
    'glucose',
    'insulin',
    'hba1c',
    'hyperglycemia',
    'hypoglycemia',
  ],
  migraine: [
    'migraine',
    'headache',
    'aura',
    'light sensitivity',
    'photophobia',
    'nausea',
    'throbbing pain',
  ],
  gastro: [
    'gastro',
    'gastroenteritis',
    'gastritis',
    'stomach',
    'abdomen',
    'abdominal pain',
    'acid reflux',
    'gerd',
    'heartburn',
    'ulcer',
    'diarrhea',
    'constipation',
    'bloating',
    'vomiting',
  ],
};

const DIABETES_SCREEN_QUESTIONS = [
  'Do you often feel very thirsty?',
  'Do you urinate more often than usual, especially at night?',
  'Have you noticed unexplained weight loss recently?',
  'Do you feel unusual fatigue most days?',
  'Do you have blurred vision at times?',
  'Do cuts or wounds take longer than usual to heal?',
  'Do you have a parent or sibling with diabetes?',
  'Are you physically inactive most days?',
];

const diabetesScreenSessions = new Map();
const diabetesOfferSessions = new Map();
const MIGRAINE_SCREEN_QUESTIONS = [
  'Do you get moderate to severe headaches that can last for hours?',
  'Is the pain usually one-sided or throbbing/pulsating?',
  'Do light or loud sounds make your headache worse?',
  'Do you feel nausea or vomiting during headache episodes?',
  'Do routine activities (walking, climbing stairs) worsen the pain?',
  'Do you sometimes get warning signs (aura), like visual changes, before headache?',
  'Have these episodes happened repeatedly in the last 3 months?',
];
const GASTRO_SCREEN_QUESTIONS = [
  'Do you often have stomach or upper abdominal discomfort?',
  'Do you have frequent acidity, heartburn, or sour reflux?',
  'Do you experience bloating, gas, or indigestion after meals?',
  'Do you have repeated nausea, vomiting, diarrhea, or constipation?',
  'Do spicy, oily, or heavy meals trigger your symptoms?',
  'Have your gastrointestinal symptoms persisted for more than 2 weeks?',
  'Have you noticed warning signs like blood in stool, black stool, or persistent severe pain?',
];
const migraineScreenSessions = new Map();
const migraineOfferSessions = new Map();
const gastroScreenSessions = new Map();
const gastroOfferSessions = new Map();

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
        ai_provider: normalizeProvider(cfg.ai_provider),
        local_api_url: String(cfg.local_api_url || '').trim(),
        local_api_key_masked: maskKey(cfg.local_api_key),
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
      if (typeof body.ai_provider === 'string' && body.ai_provider.trim()) patch.ai_provider = normalizeProvider(body.ai_provider);
      if (typeof body.local_api_url === 'string' && body.local_api_url.trim()) patch.local_api_url = body.local_api_url.trim();
      if (typeof body.local_api_key === 'string') patch.local_api_key = body.local_api_key.trim();

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
        ai_provider: normalizeProvider(updated.ai_provider),
        local_api_url: String(updated.local_api_url || '').trim(),
        local_api_key_masked: maskKey(updated.local_api_key),
        updated_at: updated.updated_at,
      });
    } catch (error) {
      json(res, 500, { error: error.message || 'Could not update config.' });
    }
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/admin/training/start') {
    if (!isAdmin(req)) {
      json(res, 401, { error: 'Unauthorized admin request.' });
      return;
    }

    try {
      const body = await readJson(req);
      const suffix = String(body?.suffix || 'medicompanion').trim().slice(0, 40) || 'medicompanion';
      const epochs = Number(body?.n_epochs);
      const n_epochs = Number.isFinite(epochs) && epochs >= 1 && epochs <= 10 ? Math.floor(epochs) : undefined;

      const runtimeCfg = await getRuntimeConfig();
      const apiKey = String(runtimeCfg.openai_api_key || '').trim();
      if (!apiKey) {
        json(res, 400, { error: 'OpenAI API key is empty in app_config.' });
        return;
      }

      const examples = await getTrainingExamples();
      if (examples.length < MIN_TRAINING_EXAMPLES) {
        json(res, 400, {
          error: `At least ${MIN_TRAINING_EXAMPLES} enabled examples are required.`,
          current_examples: examples.length,
        });
        return;
      }

      const jsonl = buildJsonl(examples);
      const fileName = `medicompanion-train-${Date.now()}.jsonl`;

      const upload = await uploadTrainingFile(apiKey, fileName, jsonl);
      const job = await createFineTuningJob({
        apiKey,
        baseModel: runtimeCfg.openai_model || 'gpt-4o-mini-2024-07-18',
        trainingFileId: upload.id,
        suffix,
        n_epochs,
      });

      json(res, 200, {
        ok: true,
        base_model: runtimeCfg.openai_model || 'gpt-4o-mini-2024-07-18',
        uploaded_file_id: upload.id,
        training_examples: examples.length,
        fine_tuning_job: job,
      });
    } catch (error) {
      json(res, 500, { error: error.message || 'Could not start training job.' });
    }
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/admin/training/status') {
    if (!isAdmin(req)) {
      json(res, 401, { error: 'Unauthorized admin request.' });
      return;
    }

    try {
      const runtimeCfg = await getRuntimeConfig();
      const apiKey = String(runtimeCfg.openai_api_key || '').trim();
      const jobId = String(requestUrl.searchParams.get('job_id') || '').trim();

      if (!apiKey) {
        json(res, 400, { error: 'OpenAI API key is empty in app_config.' });
        return;
      }

      if (!jobId) {
        json(res, 400, { error: 'job_id query param is required.' });
        return;
      }

      const job = await getFineTuningJob(apiKey, jobId);
      json(res, 200, { ok: true, fine_tuning_job: job });
    } catch (error) {
      json(res, 500, { error: error.message || 'Could not read training status.' });
    }
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/admin/training/cancel') {
    if (!isAdmin(req)) {
      json(res, 401, { error: 'Unauthorized admin request.' });
      return;
    }

    try {
      const runtimeCfg = await getRuntimeConfig();
      const apiKey = String(runtimeCfg.openai_api_key || '').trim();
      const body = await readJson(req);
      const jobId = String(body?.job_id || '').trim();

      if (!apiKey) {
        json(res, 400, { error: 'OpenAI API key is empty in app_config.' });
        return;
      }

      if (!jobId) {
        json(res, 400, { error: 'job_id is required.' });
        return;
      }

      const job = await cancelFineTuningJob(apiKey, jobId);
      json(res, 200, { ok: true, fine_tuning_job: job });
    } catch (error) {
      json(res, 500, { error: error.message || 'Could not cancel training job.' });
    }
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/chat') {
    try {
      const body = await readJson(req);
      const message = String(body?.message || '').trim();
      const history = Array.isArray(body?.history) ? body.history : [];
      const sessionId = sanitizeUuid(body?.session_id);
      const userId = sanitizeUuid(body?.user_id);

      if (!message) {
        json(res, 400, { error: 'Message is required.' });
        return;
      }

      const screeningReply = handleDiabetesScreening({ sessionId, userId, message });
      if (screeningReply) {
        if (sessionId) {
          await saveChatMessages({
            sessionId,
            userId,
            userMessage: message,
            assistantReply: screeningReply,
          });
        }
        json(res, 200, { blocked: false, reply: screeningReply });
        return;
      }

      const migraineScreeningReply = handleMigraineScreening({ sessionId, userId, message });
      if (migraineScreeningReply) {
        if (sessionId) {
          await saveChatMessages({
            sessionId,
            userId,
            userMessage: message,
            assistantReply: migraineScreeningReply,
          });
        }
        json(res, 200, { blocked: false, reply: migraineScreeningReply });
        return;
      }

      const gastroScreeningReply = handleGastroScreening({ sessionId, userId, message });
      if (gastroScreeningReply) {
        if (sessionId) {
          await saveChatMessages({
            sessionId,
            userId,
            userMessage: message,
            assistantReply: gastroScreeningReply,
          });
        }
        json(res, 200, { blocked: false, reply: gastroScreeningReply });
        return;
      }

      if (!looksAllowedTopic(message)) {
        const choices = COMMON_SYMPTOMS.map((x) => `- ${x}`).join('\n');
        json(res, 200, {
          blocked: true,
          reply:
            'I can currently assist only with these topics:\n' +
            choices +
            '\n\nYou can ask naturally, for example: "I feel very thirsty and urinate often. Could this be diabetes?"',
        });
        return;
      }

      const runtimeCfg = await getRuntimeConfig();
      const provider = normalizeProvider(runtimeCfg.ai_provider);

      if (!runtimeCfg.openai_enabled) {
        json(res, 200, {
          blocked: true,
          reply: 'Chat is temporarily disabled. Please ask the admin to enable AI chat.',
        });
        return;
      }

      const messages = [
        {
          role: 'system',
          content:
            'You are MediCompanion, a medical education assistant. Reply in English only. You must only answer these topics: Diabetes, Migraine, and Gastrointestinal (stomach) issues. If question is outside these 3 topics, politely refuse and list the 3 supported topics. Keep answers simple, clear, and short. Never provide diagnosis certainty or prescription dosage. If urgent red flags appear, advise immediate doctor/ER visit. Always end with this exact disclaimer: "This information is for educational purposes only and is not a substitute for professional medical advice."',
        },
        ...history
          .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.text })),
        { role: 'user', content: message },
      ];

      const reply =
        provider === 'local'
          ? await chatWithLocalModel(runtimeCfg, messages)
          : await chatWithOpenAI(runtimeCfg, messages);

      if (!reply) {
        json(res, 502, { error: 'No response text from model.' });
        return;
      }

      const finalReply = addDiabetesScreeningOffer({
        reply,
        message,
        sessionId,
        userId,
      });
      const finalReply2 =
        finalReply === reply
          ? addMigraineScreeningOffer({
              reply,
              message,
              sessionId,
              userId,
            })
          : finalReply;
      const finalReply3 =
        finalReply2 === reply
          ? addGastroScreeningOffer({
              reply,
              message,
              sessionId,
              userId,
            })
          : finalReply2;

      if (sessionId) {
        await saveChatMessages({
          sessionId,
          userId,
          userMessage: message,
          assistantReply: finalReply3,
        });
      }

      json(res, 200, { blocked: false, reply: finalReply3 });
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

function looksAllowedTopic(text) {
  const value = String(text || '').toLowerCase();
  return Object.values(ALLOWED_TOPIC_KEYWORDS).some((items) => items.some((k) => value.includes(k)));
}

function handleDiabetesScreening({ sessionId, userId, message }) {
  const key = getScreeningKey(sessionId, userId);
  const text = String(message || '').trim();
  const value = text.toLowerCase();
  const active = diabetesScreenSessions.get(key);
  const waitingOffer = Boolean(diabetesOfferSessions.get(key));

  if (waitingOffer) {
    const answer = parseYesNo(value);
    if (answer === true) {
      diabetesOfferSessions.delete(key);
      diabetesScreenSessions.set(key, { index: 0, answers: [] });
      return (
        'Great. Diabetes screening started. Please answer in Yes or No.\n' +
        `Question 1/${DIABETES_SCREEN_QUESTIONS.length}: ${DIABETES_SCREEN_QUESTIONS[0]} (Yes/No)`
      );
    }
    if (answer === false) {
      diabetesOfferSessions.delete(key);
      return null;
    }
    diabetesOfferSessions.delete(key);
  }

  if (active) {
    if (['stop', 'cancel', 'exit'].includes(value)) {
      diabetesScreenSessions.delete(key);
      return 'Diabetes screening stopped. You can ask about Diabetes, Migraine, or Gastro topics anytime.';
    }

    const answer = parseYesNo(value);
    if (answer === null) {
      return 'Please answer with Yes or No. You can also type "stop" to end screening.';
    }

    active.answers.push(answer);
    active.index += 1;

    if (active.index < DIABETES_SCREEN_QUESTIONS.length) {
      const qNo = active.index + 1;
      return `Question ${qNo}/${DIABETES_SCREEN_QUESTIONS.length}: ${DIABETES_SCREEN_QUESTIONS[active.index]} (Yes/No)`;
    }

    diabetesScreenSessions.delete(key);
    return buildDiabetesRiskSummary(active.answers);
  }

  if (wantsDiabetesScreening(value)) {
    diabetesScreenSessions.set(key, { index: 0, answers: [] });
    return (
      'Diabetes screening started. Please answer in Yes or No.\n' +
      `Question 1/${DIABETES_SCREEN_QUESTIONS.length}: ${DIABETES_SCREEN_QUESTIONS[0]} (Yes/No)`
    );
  }

  return null;
}

function getScreeningKey(sessionId, userId) {
  if (sessionId) return `session:${sessionId}`;
  if (userId) return `user:${userId}`;
  return 'anon:global';
}

function parseYesNo(value) {
  const yes = ['yes', 'y', 'haan', 'han', 'ji', 'yep', 'yeah'];
  const no = ['no', 'n', 'nah', 'nope'];
  if (yes.includes(value)) return true;
  if (no.includes(value)) return false;
  return null;
}

function wantsDiabetesScreening(value) {
  const hasDiabetesWord =
    value.includes('diabetes') ||
    value.includes('blood sugar') ||
    value.includes('sugar');

  const hasUncertaintyIntent =
    value.includes('screen') ||
    value.includes('check') ||
    value.includes('am i') ||
    value.includes('do i have') ||
    value.includes('could this be') ||
    value.includes('can this be') ||
    value.includes('how do i know') ||
    value.includes('how to know') ||
    value.includes('symptom') ||
    value.includes('risk') ||
    value.includes('lagta') ||
    value.includes('pata chale') ||
    value.includes('kya mujhe');

  const diabetesSymptomSignals = [
    'thirsty',
    'frequent urination',
    'urinate often',
    'peeing a lot',
    'blurred vision',
    'fatigue',
    'tired',
    'weight loss',
    'slow healing',
    'wound',
  ];
  const symptomHits = diabetesSymptomSignals.filter((x) => value.includes(x)).length;
  const hasStrongSymptomPattern = symptomHits >= 2;

  return (hasDiabetesWord && hasUncertaintyIntent) || hasStrongSymptomPattern;
}

function buildDiabetesRiskSummary(answers) {
  const yesCount = answers.filter(Boolean).length;
  let risk = 'Low likelihood';
  let next = 'Maintain healthy diet and activity, and monitor symptoms.';

  if (yesCount >= 6) {
    risk = 'High risk';
    next = 'Please arrange blood glucose or HbA1c testing soon and consult a doctor.';
  } else if (yesCount >= 3) {
    risk = 'Possible risk';
    next = 'Consider blood glucose testing and discuss with a healthcare professional.';
  }

  return (
    `Screening result: ${risk} (Yes answers: ${yesCount}/${DIABETES_SCREEN_QUESTIONS.length}).\n` +
    `${next}\n\n` +
    'This information is for educational purposes only and is not a substitute for professional medical advice.'
  );
}

function handleMigraineScreening({ sessionId, userId, message }) {
  const key = getScreeningKey(sessionId, userId);
  const value = String(message || '').trim().toLowerCase();
  const active = migraineScreenSessions.get(key);
  const waitingOffer = Boolean(migraineOfferSessions.get(key));

  if (waitingOffer) {
    const answer = parseYesNo(value);
    if (answer === true) {
      migraineOfferSessions.delete(key);
      migraineScreenSessions.set(key, { index: 0, answers: [] });
      return (
        'Great. Migraine screening started. Please answer in Yes or No.\n' +
        `Question 1/${MIGRAINE_SCREEN_QUESTIONS.length}: ${MIGRAINE_SCREEN_QUESTIONS[0]} (Yes/No)`
      );
    }
    if (answer === false) {
      migraineOfferSessions.delete(key);
      return null;
    }
    migraineOfferSessions.delete(key);
  }

  if (!active) return null;

  if (['stop', 'cancel', 'exit'].includes(value)) {
    migraineScreenSessions.delete(key);
    return 'Migraine screening stopped. You can ask about Diabetes, Migraine, or Gastro topics anytime.';
  }

  const answer = parseYesNo(value);
  if (answer === null) {
    return 'Please answer with Yes or No. You can also type "stop" to end screening.';
  }

  active.answers.push(answer);
  active.index += 1;
  if (active.index < MIGRAINE_SCREEN_QUESTIONS.length) {
    const qNo = active.index + 1;
    return `Question ${qNo}/${MIGRAINE_SCREEN_QUESTIONS.length}: ${MIGRAINE_SCREEN_QUESTIONS[active.index]} (Yes/No)`;
  }

  migraineScreenSessions.delete(key);
  return buildMigraineRiskSummary(active.answers);
}

function handleGastroScreening({ sessionId, userId, message }) {
  const key = getScreeningKey(sessionId, userId);
  const value = String(message || '').trim().toLowerCase();
  const active = gastroScreenSessions.get(key);
  const waitingOffer = Boolean(gastroOfferSessions.get(key));

  if (waitingOffer) {
    const answer = parseYesNo(value);
    if (answer === true) {
      gastroOfferSessions.delete(key);
      gastroScreenSessions.set(key, { index: 0, answers: [] });
      return (
        'Great. Gastro screening started. Please answer in Yes or No.\n' +
        `Question 1/${GASTRO_SCREEN_QUESTIONS.length}: ${GASTRO_SCREEN_QUESTIONS[0]} (Yes/No)`
      );
    }
    if (answer === false) {
      gastroOfferSessions.delete(key);
      return null;
    }
    gastroOfferSessions.delete(key);
  }

  if (!active) return null;

  if (['stop', 'cancel', 'exit'].includes(value)) {
    gastroScreenSessions.delete(key);
    return 'Gastro screening stopped. You can ask about Diabetes, Migraine, or Gastro topics anytime.';
  }

  const answer = parseYesNo(value);
  if (answer === null) {
    return 'Please answer with Yes or No. You can also type "stop" to end screening.';
  }

  active.answers.push(answer);
  active.index += 1;
  if (active.index < GASTRO_SCREEN_QUESTIONS.length) {
    const qNo = active.index + 1;
    return `Question ${qNo}/${GASTRO_SCREEN_QUESTIONS.length}: ${GASTRO_SCREEN_QUESTIONS[active.index]} (Yes/No)`;
  }

  gastroScreenSessions.delete(key);
  return buildGastroRiskSummary(active.answers);
}

function buildMigraineRiskSummary(answers) {
  const yesCount = answers.filter(Boolean).length;
  let risk = 'Low likelihood of migraine pattern';
  let next = 'Track triggers and monitor headache patterns.';

  if (yesCount >= 5) {
    risk = 'High likelihood of migraine pattern';
    next = 'Please consult a doctor or neurologist for diagnosis and management.';
  } else if (yesCount >= 3) {
    risk = 'Possible migraine pattern';
    next = 'Consider a clinical evaluation if episodes are frequent or disabling.';
  }

  return (
    `Screening result: ${risk} (Yes answers: ${yesCount}/${MIGRAINE_SCREEN_QUESTIONS.length}).\n` +
    `${next}\n\n` +
    'This information is for educational purposes only and is not a substitute for professional medical advice.'
  );
}

function buildGastroRiskSummary(answers) {
  const yesCount = answers.filter(Boolean).length;
  let risk = 'Low likelihood of persistent gastro condition';
  let next = 'Use diet and hydration precautions and monitor symptoms.';

  if (yesCount >= 5) {
    risk = 'High risk of significant gastrointestinal issue';
    next = 'Please seek medical evaluation soon, especially if warning signs are present.';
  } else if (yesCount >= 3) {
    risk = 'Possible gastrointestinal issue';
    next = 'Consider medical consultation and symptom-based evaluation.';
  }

  return (
    `Screening result: ${risk} (Yes answers: ${yesCount}/${GASTRO_SCREEN_QUESTIONS.length}).\n` +
    `${next}\n\n` +
    'This information is for educational purposes only and is not a substitute for professional medical advice.'
  );
}

function addDiabetesScreeningOffer({ reply, message, sessionId, userId }) {
  const key = getScreeningKey(sessionId, userId);
  if (diabetesScreenSessions.get(key)) return reply;
  if (!isDiabetesTopic(message)) return reply;

  diabetesOfferSessions.set(key, true);
  return (
    `${reply}\n\n` +
    'Do you want a quick diabetes symptom screening to estimate risk? Reply Yes to start.'
  );
}

function addMigraineScreeningOffer({ reply, message, sessionId, userId }) {
  const key = getScreeningKey(sessionId, userId);
  if (migraineScreenSessions.get(key)) return reply;
  if (!isMigraineTopic(message)) return reply;

  migraineOfferSessions.set(key, true);
  return (
    `${reply}\n\n` +
    'Do you want a quick migraine symptom screening to estimate risk? Reply Yes to start.'
  );
}

function addGastroScreeningOffer({ reply, message, sessionId, userId }) {
  const key = getScreeningKey(sessionId, userId);
  if (gastroScreenSessions.get(key)) return reply;
  if (!isGastroTopic(message)) return reply;

  gastroOfferSessions.set(key, true);
  return (
    `${reply}\n\n` +
    'Do you want a quick gastro symptom screening to estimate risk? Reply Yes to start.'
  );
}

function isDiabetesTopic(text) {
  const value = String(text || '').toLowerCase();
  const list = ALLOWED_TOPIC_KEYWORDS.diabetes || [];
  return list.some((k) => value.includes(k));
}

function isMigraineTopic(text) {
  const value = String(text || '').toLowerCase();
  const list = ALLOWED_TOPIC_KEYWORDS.migraine || [];
  return list.some((k) => value.includes(k));
}

function isGastroTopic(text) {
  const value = String(text || '').toLowerCase();
  const list = ALLOWED_TOPIC_KEYWORDS.gastro || [];
  return list.some((k) => value.includes(k));
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

async function getTrainingExamples() {
  if (!hasSupabaseConfig()) {
    throw new Error('SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY missing in backend/.env');
  }

  const url =
    `${SUPABASE_URL}/rest/v1/training_examples` +
    `?enabled=eq.true&select=id,system_prompt,user_input,assistant_output&order=id.asc`;
  const resp = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!resp.ok) {
    throw new Error(`Could not read training_examples (${resp.status}). Run training_examples.sql first.`);
  }

  const rows = await resp.json();
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((x) => x && String(x.user_input || '').trim() && String(x.assistant_output || '').trim())
    .map((x) => ({
      system_prompt: String(x.system_prompt || '').trim(),
      user_input: String(x.user_input || '').trim(),
      assistant_output: String(x.assistant_output || '').trim(),
    }));
}

function buildJsonl(examples) {
  const lines = examples.map((item) => {
    const systemPrompt =
      item.system_prompt ||
      'You are MediCompanion, a medical education assistant. Keep answers short and safe. No diagnosis certainty and no dosage.';
    const record = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: item.user_input },
        { role: 'assistant', content: item.assistant_output },
      ],
    };
    return JSON.stringify(record);
  });

  return `${lines.join('\n')}\n`;
}

async function uploadTrainingFile(apiKey, fileName, content) {
  const boundary = `----mc-boundary-${Date.now()}`;
  const body = [
    `--${boundary}\r\n` +
      'Content-Disposition: form-data; name="purpose"\r\n\r\n' +
      'fine-tune\r\n',
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
      'Content-Type: application/jsonl\r\n\r\n' +
      content +
      '\r\n',
    `--${boundary}--\r\n`,
  ].join('');

  const resp = await fetch('https://api.openai.com/v1/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Training file upload failed (${resp.status}): ${detail}`);
  }

  return resp.json();
}

async function createFineTuningJob({ apiKey, baseModel, trainingFileId, suffix, n_epochs }) {
  const payload = {
    model: baseModel,
    training_file: trainingFileId,
    suffix,
  };

  if (n_epochs) {
    payload.hyperparameters = { n_epochs };
  }

  const resp = await fetch('https://api.openai.com/v1/fine_tuning/jobs', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Fine-tuning job creation failed (${resp.status}): ${detail}`);
  }

  return resp.json();
}

async function getFineTuningJob(apiKey, jobId) {
  const resp = await fetch(`https://api.openai.com/v1/fine_tuning/jobs/${encodeURIComponent(jobId)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Fine-tuning status failed (${resp.status}): ${detail}`);
  }

  return resp.json();
}

async function cancelFineTuningJob(apiKey, jobId) {
  const resp = await fetch(`https://api.openai.com/v1/fine_tuning/jobs/${encodeURIComponent(jobId)}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Fine-tuning cancel failed (${resp.status}): ${detail}`);
  }

  return resp.json();
}

function normalizeProvider(value) {
  const p = String(value || 'openai').trim().toLowerCase();
  return p === 'local' ? 'local' : 'openai';
}

async function chatWithOpenAI(runtimeCfg, messages) {
  const apiKey = String(runtimeCfg.openai_api_key || '').trim();
  if (!apiKey) {
    throw new Error('OpenAI key missing in app_config table.');
  }

  const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
    throw new Error(`OpenAI request failed: ${errText}`);
  }

  const data = await openaiResp.json();
  return String(data?.choices?.[0]?.message?.content || '').trim();
}

async function chatWithLocalModel(runtimeCfg, messages) {
  const localUrl = String(runtimeCfg.local_api_url || '').trim() || 'http://127.0.0.1:11434';
  const localModel = String(runtimeCfg.openai_model || '').trim() || 'llama3.1:8b';
  const localApiKey = String(runtimeCfg.local_api_key || '').trim();

  const headers = { 'Content-Type': 'application/json' };
  if (localApiKey) headers.Authorization = `Bearer ${localApiKey}`;

  const resp = await fetch(`${localUrl.replace(/\/+$/, '')}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: localModel,
      stream: false,
      messages,
      options: { temperature: 0.2 },
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Local model request failed (${resp.status}): ${detail}`);
  }

  const data = await resp.json();
  return String(data?.message?.content || '').trim();
}

function sanitizeUuid(value) {
  const s = String(value || '').trim();
  if (!s) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)) {
    return null;
  }
  return s;
}

async function saveChatMessages({ sessionId, userId, userMessage, assistantReply }) {
  if (!hasSupabaseConfig()) return;

  const rows = [
    {
      session_id: sessionId,
      user_id: userId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    },
    {
      session_id: sessionId,
      user_id: userId,
      role: 'assistant',
      content: assistantReply,
      created_at: new Date().toISOString(),
    },
  ];

  const url = `${SUPABASE_URL}/rest/v1/chat_messages`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    console.error(`chat_messages save failed (${resp.status}) ${detail}`);
  }
}
