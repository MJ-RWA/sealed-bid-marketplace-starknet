import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import React from "react";
import ProposalForm from "./ProposalForm";
import { Contract } from "starknet";
import ABI_FILE from "../abi.json";
import { generateBidCommitment, generateRandomSalt } from "../services/blockchainUtils";
import "./BidForm.css";

const CONTRACT_ADDRESS = "0x07d4764a30d3eb83c00730c059b71b796692f292e94fc6eb2c20dea4da2b10ae";

function BidForm({ job, address, onSubmitBid }) {
  const navigate = useNavigate();
  const [bidAmount, setBidAmount] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [proposal, setProposal] = useState("");
  const [loading, setLoading] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);

  const isOwner = address?.toLowerCase() === job?.employer_address?.toLowerCase();
  const hasBid = job?.bids?.some(b => b.bidder_address?.toLowerCase() === address?.toLowerCase());

  async function handleCommit(e) {
    e.preventDefault();

    if (!window.starknet?.isConnected) {
        alert("Please connect your wallet first!");
        return;
    }

    // 1. Validation
    if (isOwner) return alert("Action denied: You cannot bid on a job you created.");
    if (hasBid) return alert("You already committed a bid.");

    setLoading(true);

    try {
      // 2. Generate Hashing Data
      const salt = generateRandomSalt();
      const commitment = generateBidCommitment(bidAmount, timeframe, salt);

      // 3. Trigger Starknet Transaction
      console.log("Committing Hash to Blockchain:", commitment);
      const account = window.starknet.account;
      const actualAbi = ABI_FILE.abi ? ABI_FILE.abi : ABI_FILE;
      const marketplaceContract = new Contract(actualAbi, CONTRACT_ADDRESS, account);

      // submit_bid(job_id, commitment)
      // Note: job.onchain_id must exist
      const { transaction_hash } = await marketplaceContract.submit_bid(
        job.onchain_id,
        commitment
      );

      // 4. Save Bid Data LOCALLY (Crucial for the Reveal Phase demo!)
      // Since the blockchain only stores the hash, the user MUST remember their price/salt.
      const localBidKey = `bid_${job.onchain_id}_${address}`;
      const bidSecretData = {
          price: bidAmount,
          timeline: timeframe,
          salt: salt,
          txHash: transaction_hash
      };
      localStorage.setItem(localBidKey, JSON.stringify(bidSecretData));

      // 5. Update parent state if needed
      if (onSubmitBid) {
        onSubmitBid({
          bidder: address,
          amount: bidAmount,
          timeframe: timeframe,
          proposal: proposal,
          revealed: false
        });
      }

      alert("Bid Sealed & Committed!\n\nYour price is now hidden behind a Poseidon hash.\nHash: " + transaction_hash);
      setCommitSuccess(true);
      navigate("commit-message");

    } catch (error) {
      console.error("Commit Error:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // View for users who already bid
  if (hasBid) {
    return (
      <div className="success-container">
         <h3>Bid Already Submitted</h3>
          <p>Your hash is secured on-chain. Please wait for the employer to start the reveal phase.</p>
         <Link to={`/jobs/${job.id}/commit-message`} className="view-link">
           View Confirmation
         </Link>
      </div>
    );
  }

  // View for the employer
  if (isOwner) {
    return (
      <div className="owner-view">
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>You created this job. You can view decrypted bids once the reveal phase begins.</p>
        </div>
         <div className="manage">
          <h2>Manage Your Job</h2>
         </div>
      </div>
    );
  }

  return (
    <div>
        <div className="modal-header">
          <div>
            <div className="status-row">
              <span className="status commit">PHASE 1: COMMIT</span>
              <span className="status reveal">PHASE 2: REVEAL</span>
            </div>
          </div>
        </div>
        <br />
      <form onSubmit={handleCommit}>
        <div className="forms"> 
            <div className="input-wrap"> 
                <label className="label1">PRICE (STRK)</label>
                <input 
                    type="number" 
                    className="bid-input" 
                    placeholder="Enter your bid amount" 
                    value={bidAmount} 
                    onChange={(e) => setBidAmount(e.target.value)} 
                    required 
                />
            </div>

            <div className="input-wrap">
                <label className="label1">TIMEFRAME (Weeks)</label>
                <input 
                    type="number" 
                    className="bid-input" 
                    placeholder="e.g. 4"
                    required 
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                />
            </div>
        </div>
        <br />
       
        <ProposalForm 
            value={proposal}
            onChange={setProposal}
        />

        <br />
        <div className="submit">
            <button className="submit1" type="submit" disabled={loading}>
                {loading ? "Sealing..." : "Seal & commit to contract"}
            </button>
        </div>
        <span className="span1">Warning: Your bid cannot be changed once committed. The Poseidon Hash ensures total privacy.</span>
        {commitSuccess && <p style={{color: 'green', textAlign: 'center'}}>Bid successfully committed!</p>}
      </form>
    </div>
  );
}

export default BidForm;