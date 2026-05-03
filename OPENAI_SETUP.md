## OpenAI + Admin Control Setup (DB Driven)

Aapki requirement ke mutabiq API key code/env se direct use nahi hogi. Key aur toggle Supabase DB me rahenge.

### 1) Supabase table banayein
Supabase SQL Editor me file `backend/sql/app_config.sql` ka SQL run karein.

### 2) Backend env set karein
`backend/.env.example` ko copy karke `backend/.env` banayein:

```env
PORT=5050
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=PASTE_SUPABASE_SERVICE_ROLE_KEY_HERE
ADMIN_SECRET=SET_ANY_STRONG_SECRET_FOR_ADMIN_ENDPOINTS
```

Important:
- `SUPABASE_SERVICE_ROLE_KEY` sirf backend me rakhein.
- Is key ko mobile app me kabhi expose na karein.

### 3) Admin se OpenAI key save + ON/OFF

#### 3.1 Current config dekhna
```bash
curl -H "x-admin-secret: YOUR_ADMIN_SECRET" http://localhost:5050/admin/config
```

#### 3.2 OpenAI key save karna + ON karna
```bash
curl -X POST http://localhost:5050/admin/config \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  -d '{"openai_api_key":"sk-...","openai_enabled":true,"openai_model":"gpt-4o-mini"}'
```

#### 3.3 Chat OFF karna (billing stop)
```bash
curl -X POST http://localhost:5050/admin/config \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  -d '{"openai_enabled":false}'
```

### 4) App behavior
- `openai_enabled=false` -> chat blocked message aayega.
- `openai_enabled=true` + valid key -> chat normal chalegi.
- Is se aap remotely ON/OFF control kar sakte hain.
