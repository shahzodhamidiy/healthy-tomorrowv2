# Healthy Tomorrow

A modern healthy-food delivery platform with **4 user panels** (Customer, Admin, Dietitian, Delivery), live chat, real-time order tracking, BMI/health tracking, subscription plans, payments, and PDF/Excel reports.

## Stack

- **Frontend:** React 18 + Vite + Tailwind + Framer Motion + Recharts + Socket.IO client → deployed on **Vercel**
- **Backend:** Python Flask + Flask-SocketIO + Flask-JWT-Extended + bcrypt → deployed on **Render/Railway**
- **Database:** MongoDB Atlas
- **Payments:** Stripe (with mock-mode fallback when secret is unset)

## Local development

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env         # fill in MONGO_URI
python seed.py               # creates demo users + meals
python run.py
```

Backend runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # default points at localhost:5000
npm run dev
```

Frontend runs on `http://localhost:5173`.

### Demo users (after seeding)

| Role      | Email                          | Password       |
|-----------|--------------------------------|----------------|
| Admin     | admin@healthytomorrow.app      | admin123       |
| Customer  | demo@healthytomorrow.app       | demo123        |
| Dietitian | sarah@healthytomorrow.app      | dietitian123   |
| Delivery  | alex@healthytomorrow.app       | delivery123    |

## Production deployment

### Step 1 — MongoDB Atlas (free)
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free **M0 cluster**
3. Database Access → create a user (save the password)
4. Network Access → add `0.0.0.0/0` (allow from anywhere)
5. Copy the connection string (looks like `mongodb+srv://<user>:<pass>@cluster.mongodb.net`)

### Step 2 — Backend on Render
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New +** → **Web Service**
3. Connect the GitHub repo, select the **`backend`** folder as the root
4. **Runtime:** Python 3 · **Build Command:** `pip install -r requirements.txt` · **Start Command:** `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT run:app`
5. Environment variables:
   - `MONGO_URI` = your Atlas connection string
   - `JWT_SECRET_KEY` = a long random string
   - `SECRET_KEY` = another long random string
   - `STRIPE_SECRET` = (optional — leave blank for mock-mode payments)
6. Deploy. Your backend URL will be `https://<service-name>.onrender.com`
7. After first deploy, run the seed once via Render Shell: `python seed.py`

### Step 3 — Frontend on Vercel
1. Go to [vercel.com/new](https://vercel.com/new) → import the repo
2. **Root Directory:** `frontend`
3. **Framework Preset:** Vite (auto-detected)
4. Environment variables:
   - `VITE_BACKEND_URL` = `https://<your-render-service>.onrender.com`
5. Deploy

That's it — your full app is live.

## Project structure

```
healthy-tomorrow-v2/
├── backend/                Flask API
│   ├── app/
│   │   ├── routes/         All REST blueprints (auth, meals, orders, admin, etc.)
│   │   ├── utils/          Auth helpers (JWT, bcrypt, serialize)
│   │   ├── sockets.py      Socket.IO event handlers
│   │   └── __init__.py     App factory
│   ├── seed.py             Demo data
│   ├── run.py              Entrypoint
│   ├── Procfile            Render/Railway start command
│   └── requirements.txt
└── frontend/               React/Vite SPA
    ├── src/
    │   ├── pages/          Landing, Login + customer/, admin/, dietitian/, delivery/
    │   ├── components/     Layout, Protected, AdminShell, DietitianShell, DeliveryShell
    │   ├── contexts/       AuthContext, CartContext
    │   └── lib/            api.js (axios), socket.js (Socket.IO)
    ├── vite.config.mjs
    └── vercel.json
```

## Features by panel

**Customer** — meal browse/search/filter · cart · checkout · BMI gauge · weight chart · calorie ring · favorites · subscription plans · live dietitian chat · order tracking with progress steps · reviews

**Admin** — analytics dashboard (revenue chart, top meals, status breakdown) · user CRUD · meal CRUD · order management · delivery assignment · refunds · PDF/Excel exports · activity log

**Dietitian** — appointments management · meal plans · client health profiles (BMI history, weight trends) · live chat with customers

**Delivery** — assigned active deliveries · navigate to address · status updates (out-for-delivery → delivered) · history · daily earnings chart

## Security

- bcrypt password hashing
- JWT auth with 7-day expiry
- Role-based access on every endpoint (`@role_required("admin")`)
- CORS configured for API routes only
- Image uploads validated by extension + size
- Suspended accounts blocked at the JWT layer
