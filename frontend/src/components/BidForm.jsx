import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import React from "react";
import ProposalForm from "./ProposalForm";
import { Contract } from "starknet";
import ABI_FILE from "../abi.json";
import { generateBidCommitment, generateRandomSalt } from "../services/blockchainUtils";
import "./BidForm.css";

// CONFIGURATION
const CONTRACT_ADDRESS = "0x07d4764a30d3eb83c00730c059b71b796692f292e94fc6eb2c20dea4da2b10ae";
const BIDS_API_URL = "https://fairlance.onrender.com/api/bids/";

function BidForm({ job, address, onSubmitBid }) {
  const navigate = useNavigate();
  const [bidAmount, setBidAmount] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [proposal, setProposal] = useState("");
  const [loading, setLoading] = useState(false);

  const isOnChain = job?.onchain_id !== null && job?.onchain_id !== undefined;
  const isOwner = address?.toLowerCase() === (job?.employer_address || job?.employerAddress)?.toLowerCase();
  const hasBid = job?.bids?.some(b => b.bidder_address?.toLowerCase() === address?.toLowerCase());

  async function handleCommit(e) {
    e.preventDefault();

    if (!window.starknet?.isConnected) return alert("Please connect wallet");
    if (!isOnChain) return alert("This job is not yet synced with Starknet.");

    setLoading(true);

    try {
      const salt = generateRandomSalt();
      const commitment = generateBidCommitment(bidAmount, timeframe, salt);

      // 1. STARKNET TRANSACTION FIRST
      const actualAbi = ABI_FILE.abi ? ABI_FILE.abi : ABI_FILE;
      const account = window.starknet.account;
      const marketplaceContract = new Contract(actualAbi, CONTRACT_ADDRESS, account);

      console.log("Requesting Wallet Signature for commitment...");
      const { transaction_hash } = await marketplaceContract.submit_bid(
        job.onchain_id, 
        commitment
      );

      // 2. SAVE TO BACKEND (Only if wallet succeeds)
      console.log("Saving Bid metadata to Django...");
      const backendResponse = await fetch(BIDS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: job.id, // IMPORTANT: Sending the Primary Key ID for the ForeignKey
          bidder_address: window.starknet.selectedAddress,
          proposal: proposal,
          // We do not send price/time yet (Sealed!)
        }),
      });

      if (!backendResponse.ok) {
          const err = await backendResponse.text();
          console.error("Django rejected the bid:", err);
      }

      // 3. SAVE SECRETS LOCALLY (Required for the REVEAL phase later)
      const localBidKey = `bid_${job.onchain_id}_${window.starknet.selectedAddress}`;
      localStorage.setItem(localBidKey, JSON.stringify({
          price: bidAmount,
          timeline: timeframe,
          salt: salt,
          txHash: transaction_hash
      }));

      alert("Bid Sealed & Submitted!\nHash: " + transaction_hash);
      
      // Navigate back to clear the modal and refresh the view
      navigate("/ExploreMarket");

    } catch (error) {
      console.error("Bid Submission Error:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (isOwner) return <p className="notice-text">You are the employer.</p>;
  if (hasBid) return <div className="success-container"><h3>Bid Submitted</h3><p>Waiting for reveal phase.</p></div>;

  return (
    <form onSubmit={handleCommit}>
      <div className="modal-header">
        <div className="status-row">
            <span className="status commit">PHASE 1: COMMIT</span>
            <span className="status reveal">PHASE 2: REVEAL</span>
        </div>
      </div>
      <br />
      <div className="forms"> 
        <div className="input-wrap"> 
          <label className="label1">PRICE (STRK)</label>
          <input type="number" className="bid-input" placeholder="Enter amount" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} required />
        </div>
        <div className="input-wrap">
          <label className="label1">TIMEFRAME (Weeks)</label>
          <input type="number" className="bid-input" placeholder="e.g. 2" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} required />
        </div>
      </div>
      <br />
      <ProposalForm value={proposal} onChange={setProposal} />
      <br />
      <div className="submit">
        <button className="submit1" type="submit" disabled={loading || !isOnChain}>
          {loading ? "Sealing..." : "Seal & commit to contract"}
        </button>
      </div>
      <span className="span1">Warning: Your bid cannot be changed once committed. The Hash ensures fairness.</span>
    </form>
  );
}

export default BidForm;