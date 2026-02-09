# 🗄️ Backend — Sealed Bid Marketplace (MVP)

This folder contains the **backend services** for the Private Sealed-Bid Marketplace.

The backend is **supporting infrastructure**, not the source of truth.
All fairness and bid verification happens **on-chain**.

---

## 🎯 Backend Responsibilities (MVP Scope)

- Store job metadata (title, description, timestamps)
- Track job deadlines
- Listen to Starknet smart contract events
- Expose simple APIs for the frontend
- Improve performance & UX (faster reads)

---

## 🧠 What the Backend Does NOT Do

- ❌ Does NOT decide winners
- ❌ Does NOT verify bids
- ❌ Does NOT handle privacy logic
- ❌ Does NOT override smart contracts

> Smart contracts are the final authority.

---

## 📂 Folder Structure

backend/
├── src/
│ ├── index.js # App entry point
│ ├── routes/
│ │ └── jobs.js # Job-related endpoints
│ ├── services/
│ │ └── starknetListener.js
│ ├── db.js # Simple data storage
│ └── config.js
│
├── package.json
└── README.md


---

## 🔧 Tech Stack (Suggested)

- Node.js
- Express.js
- Starknet.js (for event listening)
- Simple DB (SQLite / JSON / in-memory)

> Keep it lightweight. This is a hackathon MVP.

---

## 🚀 Getting Started

### Install dependencies
```bash
npm install
