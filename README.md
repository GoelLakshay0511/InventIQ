# 📦 Inventiq — Smart Kirana Inventory Forecaster

> Smart restock predictions for neighborhood kirana stores, powered by sales forecasting and WhatsApp automation.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 8+ (with workspaces support)
- MongoDB Atlas account ([free tier](https://www.mongodb.com/cloud/atlas))
- Cloudinary account ([free tier](https://cloudinary.com))

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd inventiq
npm install          # installs root devDependencies
npm run install:all  # installs server + client deps
```

### 2. Configure Environment Variables

```bash
# Copy the example env file to the server directory
cp .env.example server/.env
```

Then edit `server/.env` and fill in your:
- `MONGODB_URI` — from MongoDB Atlas
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — random 64-char strings
- `CLOUDINARY_*` — from your Cloudinary dashboard

Create the client env file:
```bash
echo "VITE_API_BASE_URL=http://localhost:5001/api" > client/.env
```

### 3. Run in Development
```bash
npm run dev
```
This starts both:
- **API server** → http://localhost:5001
- **React client** → http://localhost:5173

---

## 🏗️ Project Structure

```
inventiq/
├── client/                          # React 18 + Vite PWA
│   ├── public/
│   │   └── manifest.json            # PWA manifest
│   └── src/
│       ├── api/client.js            # Axios + JWT interceptors
│       ├── store/authStore.js       # Zustand (UI/auth state)
│       ├── layouts/AppLayout.jsx    # Sidebar + bottom nav shell
│       ├── pages/
│       │   ├── DashboardPage.jsx    # Reorder alerts + stats
│       │   ├── QuickTapPage.jsx     # Daily sales entry (Top-25)
│       │   ├── ProductsPage.jsx     # Product catalog
│       │   ├── ReorderPage.jsx      # Suggestions + WhatsApp
│       │   └── DistributorsPage.jsx
│       └── components/shared/
│
├── server/                          # Node.js + Express API
│   ├── app.js                       # Express setup + routes
│   ├── server.js                    # Entry point + cron init
│   └── src/
│       ├── config/db.js             # Mongoose connection
│       ├── middleware/              # Auth, error handling
│       ├── modules/                 # Feature modules
│       │   ├── auth/                # Register, login, refresh
│       │   ├── products/            # Product CRUD
│       │   ├── sales/               # Sales logging + CSV import
│       │   ├── distributors/        # Distributor CRUD
│       │   └── reorder/             # Suggestion management
│       ├── services/
│       │   ├── forecasting.js       # 🧠 Core WMA algorithm
│       │   └── whatsapp.js          # wa.me link generator
│       └── jobs/cron/
│           └── nightlyForecast.js   # 11 PM IST daily cron
│
├── .env.example                     # Environment variable template
├── .gitignore
└── package.json                     # npm workspaces root
```

---

## 🧠 How the Forecasting Engine Works

```
1. Pull last 28 days of sales for each product
2. Weighted Moving Average (last 7 days, recent = higher weight)
3. Apply seasonal multipliers:
   - Weekend (Fri/Sat/Sun): ×1.15
   - Salary week (1st–7th): ×1.25
4. Safety Stock = 1.65 × σ(daily_sales) × √(lead_time_days)
5. Reorder Point = (avg_daily × lead_time) + safety_stock
6. If currentStock ≤ reorderPoint → generate suggestion
7. Order Qty → rounded up to nearest pack/carton size
```

---

## 📱 Core Features

| Feature | Description |
|---------|-------------|
| **Quick-Tap Sales** | Tap +/- to log daily sales for Top-25 items in < 60 seconds |
| **Smart Forecasting** | Weighted moving average with weekend + salary-week boosts |
| **Reorder Alerts** | Color-coded urgency (🔴 Critical → 🟡 Medium → 🟢 Low) |
| **WhatsApp Orders** | 1-tap `wa.me` link with pre-filled order message per distributor |
| **CSV Import** | Upload Vyapar/Khatabook weekly export |
| **PWA** | Installable on Android/iOS, works offline |

---

## 🔐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new store |
| `POST` | `/api/auth/login` | Login → access token + refresh cookie |
| `POST` | `/api/auth/refresh` | Refresh access token silently |
| `GET` | `/api/products/top-sellers` | Top 25 items for quick-tap |
| `POST` | `/api/sales/batch` | Batch log daily sales |
| `POST` | `/api/sales/import/csv` | Import CSV from billing app |
| `POST` | `/api/reorder/generate` | Trigger forecast now |
| `GET` | `/api/reorder/suggestions` | Get latest reorder suggestions |
| `POST` | `/api/reorder/whatsapp` | Get WhatsApp order links |

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn-style components
- **State**: Zustand (UI) + TanStack Query (server/API state)
- **Charts**: Recharts
- **Backend**: Node.js + Express
- **Auth**: JWT (access 15min in-memory) + Refresh token (7d HttpOnly cookie)
- **Database**: MongoDB + Mongoose
- **Scheduler**: node-cron (nightly 11 PM IST)
- **WhatsApp**: wa.me deep links (zero cost)
- **PWA**: vite-plugin-pwa + Workbox

---

## 📄 License

MIT — built for the FS Project, Sem 5.
