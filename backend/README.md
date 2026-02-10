# Fairlance Backend

This backend supports the Fairlance MVP by handling off-chain data.

## Responsibilities

- Store job metadata
- Store bid proposal text
- Track deadlines
- Listen to Starknet contract events
- Serve data to frontend

## What Backend Stores

- Job descriptions
- Freelancer proposal text
- Shortlisted bid references

## What Backend Does NOT Do

- Bid scoring
- Winner selection
- Privacy enforcement

All fairness logic lives on-chain.
