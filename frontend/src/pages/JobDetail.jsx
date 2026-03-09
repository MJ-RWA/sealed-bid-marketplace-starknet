import { useNavigate, useParams } from "react-router-dom";
import BidForm from "../components/BidForm";
import React, { useState } from "react";
import { Contract } from "starknet";
import ABI_FILE from "../abi.json";
import "./JobDetail.css";

const CONTRACT_ADDRESS = "0x07d4764a30d3eb83c00730c059b71b796692f292e94fc6eb2c20dea4da2b10ae";

function JobDetail({ jobs, address, role }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  const job = jobs?.find(j => j && (String(j.id) === id || String(j.onchain_id) === id));
  
  if (!job) return <div className="loading">Loading job details...</div>;

  const isOwner = address?.toLowerCase() === (job.employer_address || job.employerAddress)?.toLowerCase();
  const status = job.status?.toUpperCase();

  // --- EMPLOYER: Start Reveal Phase ---
  const handleStartReveal = async () => {
    setLoading(true);
    try {
      const account = window.starknet.account;
      const actualAbi = ABI_FILE.abi ? ABI_FILE.abi : ABI_FILE;
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, account);
      
      const { transaction_hash } = await contract.start_reveal_phase(job.onchain_id);
      alert("Reveal Phase Started! Hash: " + transaction_hash);
      navigate("/Myprojects");
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FREELANCER: Reveal Bid ---
  const handleRevealBid = async () => {
    // 1. Get secret data from LocalStorage
    const secretKey = `bid_${job.onchain_id}_${address}`;
    const secretData = JSON.parse(localStorage.getItem(secretKey));

    if (!secretData) {
      alert("Secret salt not found in this browser. You must manually enter your salt to reveal.");
      return;
    }

    setLoading(true);
    try {
      const account = window.starknet.account;
      const actualAbi = ABI_FILE.abi ? ABI_FILE.abi : ABI_FILE;
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, account);

      // reveal_bid(job_id, price, timeline, salt)
      const { transaction_hash } = await contract.reveal_bid(
        job.onchain_id,
        secretData.price,
        secretData.timeline,
        secretData.salt
      );

      alert("Bid Successfully Revealed! Hash: " + transaction_hash);
      navigate("/ExploreMarket");
    } catch (e) {
      alert("Reveal Failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay">
      <div className="jobdetail-modal">
        <button className="close-btn" onClick={() => navigate(-1)}>✕</button>
        <h1>{job.title}</h1>
        <p>{job.description}</p>
        <hr />

        {/* PHASE 1: BIDDING */}
        {status === "BIDDING" && (
          <>
            {isOwner ? (
                <button className="action-btn" onClick={handleStartReveal} disabled={loading}>
                  {loading ? "Processing..." : "Start Reveal Phase"}
                </button>
            ) : (
                <BidForm job={job} address={address} />
            )}
          </>
        )}

        {/* PHASE 2: REVEAL */}
        {status === "REVEAL" && (
          <div className="reveal-area">
            <h3>Reveal Phase is Live</h3>
            {job.bids?.some(b => b.bidder_address === address) ? (
               <button className="action-btn" onClick={handleRevealBid} disabled={loading}>
                 {loading ? "Unsealing..." : "Reveal My Bid"}
               </button>
            ) : (
               <p>Waiting for freelancers to reveal bids...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default JobDetail;