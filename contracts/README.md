# Fairlance Smart Contracts

This folder contains the Starknet (Cairo) smart contracts for Fairlance,
a private sealed-bid marketplace for Web3 services.

## What the Smart Contract Does

The contract is responsible for enforcing fairness and privacy:

- Create job listings
- Accept sealed bid commitments
- Verify revealed bids
- Shortlist bids based on:
  - Lowest price
  - Shortest completion time
- Allow employer to select a winner from shortlisted bids

## What the Contract Does NOT Handle

- Proposal text content
- UI logic
- Databases or APIs

## Core Functions

- `create_job(title, deadline)`
- `submit_bid(job_id, commitment)`
- `reveal_bid(job_id, price, time, salt)`
- `shortlist_bids(job_id)`
- `select_winner(job_id, bid_id)`

## Notes for Developers

- Proposal text is handled off-chain
- Scoring logic is intentionally simple for MVP
- Identity remains hidden until final selection
