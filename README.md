# tradeovate-server2

Node/Express server for tracking trading signals & orders, backed by Supabase.  
This repo contains the Express routes, Supabase client wrapper, and docs to run the service locally or in deployment.

---

## 🚀 Stack
- Node 18+ (dev is on Node v24 OK)
- Express
- supabase-js client
- Postgres (Supabase)

---

## 📂 Folder Layout
/src
index.js            # server entry
/lib
supabase.js       # supabase client wrapper
validate.js       # validation helpers
/routes
dev.js
dashboard.js
orders.js
executions.js
signals.js
tokensIntake.js
settings.js
ledger.js
---
## ⚙️ Environment variables

Create a `.env` file in your project root (never commit real secrets).  
Use this template as a guide:

```env
# Server basics
PORT=8080
BASE_URL=http://localhost:8080

# Tradeovate OAuth placeholders (fill when ready)
TRADEOVATE_CLIENT_ID=TODO_FILL_IN
TRADEOVATE_CLIENT_SECRET=TODO_FILL_IN
TRADEOVATE_OAUTH_AUTHORIZE_URL=TODO_FILL_IN
TRADEOVATE_OAUTH_TOKEN_URL=TODO_FILL_IN
TRADEOVATE_REDIRECT_URI=http://localhost:8080/auth/callback

# Supabase (replace with your project info)
SUPABASE_URL=https://etgbprdctaq1wukmkymq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY   # never commit the real key
SUPABASE_ANON_KEY=YOUR_ANON_KEY                   # optional
