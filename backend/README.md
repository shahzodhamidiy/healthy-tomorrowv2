# Healthy Tomorrow — Backend (Flask)

Flask + MongoDB + Socket.IO + JWT auth.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # fill in MONGO_URI etc.
python seed.py                # creates sample users + meals
python run.py
```

Server runs on `http://localhost:5000`.

## Default users (after seeding)

| Role      | Email                          | Password       |
|-----------|--------------------------------|----------------|
| Admin     | admin@healthytomorrow.app      | admin123       |
| Customer  | demo@healthytomorrow.app       | demo123        |
| Dietitian | sarah@healthytomorrow.app      | dietitian123   |
| Delivery  | alex@healthytomorrow.app       | delivery123    |

## Routes

- `POST /api/auth/{register,login}` — auth
- `GET /api/auth/me` — current user
- `GET /api/meals` — browse meals (filters: `?category=…&vegan=1&q=…`)
- `POST /api/orders` — create order
- `POST /api/payments/checkout` — Stripe checkout (mock if STRIPE_SECRET unset)
- `GET /api/admin/stats` — admin dashboard analytics
- `GET /api/reports/revenue.pdf` — exports
- Socket events: `chat:join`, `chat:message`, `order:track`, `delivery:location`

## Deploying

**Render / Railway:** point at this folder, the `Procfile` does the rest. Set env vars in the dashboard.
**MongoDB Atlas:** create a free cluster, paste the connection string into `MONGO_URI`.
