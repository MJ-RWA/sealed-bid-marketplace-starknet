# 🖥️ Frontend — Sealed Bid Marketplace (MVP)

This folder contains the **frontend application** for the Private Sealed-Bid Marketplace.

The frontend is responsible for **user interaction only**.
All fairness, bid validation, and winner selection happen **on-chain**.

---

## 🎯 Frontend Responsibilities (MVP Scope)

- Allow users to:
  - Create a job
  - Submit a sealed bid
  - Reveal their bid
  - View the winning bid
- Connect UI actions to Starknet smart contract calls
- Display contract results clearly

---

## 🧠 What the Frontend Does NOT Do

- ❌ Does NOT decide winners
- ❌ Does NOT verify bids
- ❌ Does NOT store sensitive bid data
- ❌ Does NOT implement business logic

> The frontend is a messenger, not a judge.

---

## 📂 Folder Structure

frontend/
├── src/
│ ├── components/
│ │ ├── JobForm.jsx
│ │ ├── BidForm.jsx
│ │ ├── RevealForm.jsx
│ │ └── WinnerCard.jsx
│ ├── pages/
│ │ └── Home.jsx
│ ├── hooks/
│ │ └── useStarknet.js
│ ├── services/
│ │ └── contract.js
│ ├── App.jsx
│ └── main.jsx
│
├── public/
├── package.json
└── README.md


---

## 🔧 Tech Stack

- React (Vite)
- JavaScript or TypeScript
- Starknet.js
- Basic CSS / TailwindCSS (optional)

> Keep styling simple. Functionality first.

---

## 🚀 Getting Started

### Install dependencies
```bash
npm install

Start development server
npm run dev