# Fairlance Frontend

This is the React frontend for Fairlance.

## Responsibilities

The frontend handles all user interactions:

- Job creation
- Bid submission
- Proposal writing
- Bid reveal
- Employer review & selection

## Bid Submission Flow

1. Freelancer enters:
   - Price
   - Timeframe
   - Proposal text
2. Frontend:
   - Generates commitment hash
   - Sends hash to smart contract
   - Sends proposal text to backend

## Employer Review Flow

- View shortlisted bids
- Compare price & time
- Read proposal text
- Select a winner

## What Frontend Does NOT Handle

- Bid scoring logic
- Fairness rules
- Blockchain state validation
