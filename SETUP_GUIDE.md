# 📦 Inventiq — Teammate Setup Guide

Welcome to **Inventiq (Smart Kirana Inventory & Reorder Forecaster)**! Follow these simple steps to run the complete project on your computer.

---

## ⚡ Quick 3-Step Setup

### 1. Prerequisites
- **Node.js**: v18 or higher ([Download Node.js](https://nodejs.org/))
- **MongoDB**: Make sure MongoDB is running locally (e.g. via **MongoDB Compass** on `mongodb://127.0.0.1:27017`) or use a free MongoDB Atlas connection string.

---

### 2. Install Dependencies
Open a terminal in the project root (`inventiq/`) and run:

```bash
npm run install:all
```
*(This installs all root, client, and server dependencies in one command).*

---

### 3. Seed Demo Data & Start the App

#### Step A: Seed the database with demo products & sales history
```bash
npm run seed
```
> **Default Demo Login:**
> - **Phone:** `9876543210`
> - **Password:** `demo1234`
> *(Or click "Register" on the login screen to create your own store).*

#### Step B: Start both Client & Server concurrently
```bash
npm run dev
```

- **Frontend App:** http://localhost:5173
- **Backend API:** http://localhost:5001/health

---

## 🎯 Key Features to Test & Demo

1. **Daily Sales Entry (Quick Tap & Voice)**
   - Head to **Daily Sales** tab.
   - Speak in either English (*"10 Colgate and 5 Parle-G sold today"*) or Hindi (*"10 फ्रूटी और 5 पारले जी आज बिके"*).
   - Tap **"Save Today's Sales"** to update stock in real-time.

2. **Forecast & Reorder Engine**
   - Head to **Dashboard** $\rightarrow$ Click **"Generate New Forecast"**.
   - Navigate to **Reorder** tab to view urgency badges (Critical, High, Medium, Low) and distributor-grouped orders.
   - Click **"Send WhatsApp Order"** to generate `wa.me` links with auto-formatted kirana supply orders.
   - Click **"📦 Mark Delivered & Restock (+Stock)"** when a supplier delivery arrives.

3. **Wholesale Invoice OCR Scanner**
   - Click **"📷 Scan Invoice (OCR)"** on the Products or Reorder page.
   - Use the 1-click test presets (**Sharma Brothers Wholesale** or **Mumbai Dairy**) or upload/drag the sample invoice PNG images from `client/public/demo-invoices/`.
   - Click **"Confirm & Add to Stock"** to automatically restock your inventory!
