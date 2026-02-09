# 🧱 Smart Contracts — Sealed Bid Marketplace (Starknet)

This folder contains the **Cairo smart contracts** for the Private Sealed-Bid Marketplace MVP.

The contract enforces **fairness and privacy** using a simple **commit → reveal** mechanism.

---

## 🎯 What This Contract Does (MVP Scope)

- Allows a user to create a job
- Allows providers to submit a **sealed bid** (hash)
- Allows bids to be revealed after deadline
- Verifies bids on-chain
- Automatically selects a winner

This is a **real, testable MVP**, not a mockup.

---

## 🧠 Core Concept (Simple Explanation)

1. A job is created with a deadline  
2. Bidders submit a **commitment**  
3. After the deadline, bidders reveal:
- price
- salt
4. The contract checks:
- The reveal matches the commitment
- The bid was not modified
5. The contract selects the lowest valid bid as winner

---

## 📂 Folder Structure

contracts/
├── src/
│ ├── job.cairo # Job creation logic
│ ├── bid.cairo # Bid commit & reveal logic
│ └── lib.cairo # Shared structs & helpers
│
├── tests/
│ └── test_bids.cairo
│
├── Scarb.toml
└── README.md


---

## 🧩 Key Functions (Expected)

- `create_job(title, deadline, budget_min, budget_max)`
- `submit_bid(job_id, commitment)`
- `reveal_bid(job_id, price, salt)`
- `select_winner(job_id)`

---

## 🚀 How to Run Locally

Install Scarb if not installed:
```bash
curl -L https://install.scarb.sh | bash
