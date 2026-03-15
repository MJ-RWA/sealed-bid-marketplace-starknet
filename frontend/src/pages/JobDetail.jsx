import { useNavigate, useParams } from "react-router-dom";
import BidForm from "../components/BidForm";
import React, { useState } from "react";
import { Contract } from "starknet";
import ABI_FILE from "../abi.json";
import { normalizeAddress } from "../services/blockchainUtils";
import "./JobDetail.css";

const CONTRACT_ADDRESS = "0x07d4764a30d3eb83c00730c059b71b796692f292e94fc6eb2c20dea4da2b10ae";
const API_BASE = "https://fairlance.onrender.com/api/jobs/";

function JobDetail({ jobs, address, role, onUpdate }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  const job = jobs?.find(j => j && (String(j.id) === id || String(j.onchain_id) === id));
  if (!job) return null;

  const userAddr = normalizeAddress(address);
  const employerAddr = normalizeAddress(job.employer_address || job.employerAddress);
  const isOwner = userAddr === employerAddr;
  const status = job.status?.toUpperCase() || "BIDDING";
  const actualAbi = ABI_FILE.abi || ABI_FILE;

  // --- REUSABLE BLOCKCHAIN INVOKER ---
  const executeBlockchainTransaction = async (blockchainFn, args = []) => {
    // FACT: We must get the FRESH account object from the injected wallet
    const starknet = window.starknet;
    
    if (!starknet || !starknet.isConnected || !starknet.account) {
        throw new Error("Wallet account not found. Please click 'Connect' again.");
    }

    // Initialize contract with the ACTIVE account (the Signer)
    const contract = new Contract(actualAbi, CONTRACT_ADDRESS, starknet.account);
    
    console.log(`Invoking ${blockchainFn} on-chain for Job ID: ${job.onchain_id}...`);
    
    // We use the spread operator ...args to handle different function inputs
    return await contract[blockchainFn](...args);
  };

  const handleUpdateStatus = async (newStatus, blockchainFn) => {
    if (!isOwner) return alert("Error: Only the employer can trigger this phase.");
    
    setLoading(true);
    try {
      // 1. Blockchain Call (Pass ID as BigInt for safety)
      const tx = await executeBlockchainTransaction(blockchainFn, [BigInt(job.onchain_id)]);
      console.log("Blockchain Success! Hash:", tx.transaction_hash);
      
      // 2. Direct Backend Update
      await fetch(`${API_BASE}${job.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
      });

      alert(`Success! Phase changed to ${newStatus}.`);
      if (onUpdate) onUpdate();
      navigate("/ExploreMarket");
    } catch (e) { 
        console.error("TX ERROR:", e);
        alert("Transaction Failed: " + e.message); 
    } finally { setLoading(false); }
  };

  const handleRevealBid = async () => {
    const secretData = JSON.parse(localStorage.getItem(`bid_${job.onchain_id}_${address}`));
    if (!secretData) return alert("Secret salt not found in this browser.");

    setLoading(true);
    try {
      // Arguments: job_id, price, timeline, salt
      const args = [
          BigInt(job.onchain_id), 
          BigInt(secretData.price), 
          BigInt(secretData.timeline), 
          BigInt(secretData.salt)
      ];

      const tx = await executeBlockchainTransaction("reveal_bid", args);
      
      alert("Bid Successfully Revealed! Hash: " + tx.transaction_hash);
      if (onUpdate) onUpdate();
      navigate("/ExploreMarket");
    } catch (e) { 
        alert("Reveal Failed: " + e.message); 
    } finally { setLoading(false); }
  };

  const handleHireWinner = async (winnerAddr) => {
    setLoading(true);
    try {
      await executeBlockchainTransaction("select_winner", [BigInt(job.onchain_id), winnerAddr]);
      
      await fetch(`${API_BASE}${job.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED", winner: winnerAddr })
      });

      alert("Freelancer Hired! Project finalized.");
      if (onUpdate) onUpdate();
      navigate("/ExploreMarket");
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div className="cancelbtn"><button type="button" onClick={() => navigate(-1)}>✕</button></div>
        <h1 className="projh">{job.title}</h1>
        <p style={{marginTop: '10px'}}>{job.description}</p>
        <hr style={{margin: '25px 0', border: '0', borderTop: '1px solid var(--divider)'}} />

        {status === "BIDDING" && (
          isOwner ? (
             <div style={{textAlign:'center'}}>
               <p>Job is in Bidding Phase. Once ready, start the Reveal phase.</p>
               <button className="btn2" onClick={() => handleUpdateStatus("REVEAL", "start_reveal_phase")} disabled={loading}>
                 {loading ? "Processing..." : "Start Reveal Phase"}
               </button>
             </div>
          ) : <BidForm job={job} address={address} />
        )}

        {status === "REVEAL" && (
          <div style={{textAlign: 'center'}}>
            <h3>Phase 2: Reveal Phase Active</h3>
            {isOwner ? (
                <button className="btn2" onClick={() => handleUpdateStatus("SHORTLISTED", "finalize_and_shortlist")} disabled={loading}>
                    {loading ? "Processing..." : "Run On-Chain Shortlist"}
                </button>
            ) : (
                job.bids?.some(b => normalizeAddress(b.bidder_address) === userAddr) ? (
                    <button className="btn2" onClick={handleRevealBid} disabled={loading}>Reveal My Bid</button>
                ) : <p>Waiting for reveal period to end...</p>
            )}
          </div>
        )}

        {status === "SHORTLISTED" && (
            <div style={{textAlign: 'center'}}>
                <h3>Top Ranked Candidates</h3>
                <div className="bids-list" style={{marginTop: '20px'}}>
                    {job.bids?.map(bid => (
                        <div key={bid.id} className="bid-row" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '10px'}}>
                            <span style={{fontFamily: 'monospace'}}>{bid.bidder_address.slice(0, 12)}...</span>
                            {isOwner && (
                                <button className="prove1" onClick={() => handleHireWinner(bid.bidder_address)}>Hire</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {(status === "COMPLETED" || status === "FINALIZED") && (
            <div style={{textAlign:'center'}}>
                <h2 style={{color: '#10b981'}}>✔ Project Finalized</h2>
                <p>This job is completed on the blockchain.</p>
            </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(11, 21, 33, 0.9)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 };
const modalStyle = { background: "var(--Navbar-bg)", padding: "40px", borderRadius: "15px", width: "95%", maxWidth: "600px", color: "white", border: "1px solid var(--border-main)", maxHeight: '90vh', overflowY: 'auto' };

export default JobDetail;