import { useNavigate, useParams } from "react-router-dom";
import BidForm from "../components/BidForm";
import React, { useState } from "react";
import { Contract } from "starknet";
import ABI_FILE from "../abi.json";
import { normalizeAddress } from "../services/blockchainUtils";
import "./JobDetail.css";

// Configuration
const CONTRACT_ADDRESS = "0x07d4764a30d3eb83c00730c059b71b796692f292e94fc6eb2c20dea4da2b10ae";
const API_BASE = "https://fairlance.onrender.com/api/jobs/";

function JobDetail({ jobs, address, role, onUpdate }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  // 1. Find the job (checks both DB ID and On-chain ID)
  const job = jobs?.find(j => j && (String(j.id) === id || String(j.onchain_id) === id));
  
  if (!job) return null;

  // 2. Normalization Helpers
  const userAddr = normalizeAddress(address);
  const employerAddr = normalizeAddress(job.employer_address || job.employerAddress);
  const isOwner = userAddr === employerAddr;
  const status = job.status?.toUpperCase() || "BIDDING";
  const actualAbi = ABI_FILE.abi || ABI_FILE;

  // Check if current user has a bid on this job
  const hasMyBid = job.bids?.some(b => normalizeAddress(b.bidder_address) === userAddr);

  // --- GENERAL STATUS UPDATER (Start Reveal, Finalize Shortlist) ---
  const handleUpdateStatus = async (newStatus, blockchainFn) => {
    if (!isOwner) return alert("Only the employer can trigger this phase.");
    if (!job.onchain_id) return alert("This job has no On-chain ID linked.");

    setLoading(true);
    try {
      const account = window.starknet.account;
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, account);
      
      // 1. CALL BLOCKCHAIN
      await contract[blockchainFn](BigInt(job.onchain_id));
      
      // 2. DIRECT BACKEND UPDATE
      await fetch(`${API_BASE}${job.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
      });

      alert(`Success! Job is now in the ${newStatus} phase.`);
      if (onUpdate) onUpdate();
      navigate("/ExploreMarket");
    } catch (e) { 
        alert("Transaction Failed: " + e.message); 
    } finally { setLoading(false); }
  };

  // --- FREELANCER: Reveal Bid ---
  const handleRevealBid = async () => {
    // Retrieve secret data from LocalStorage (Saved during BidForm submission)
    const secretData = JSON.parse(localStorage.getItem(`bid_${job.onchain_id}_${address}`));
    
    if (!secretData) {
        return alert("Secret salt not found. Did you bid on this job using a different computer?");
    }

    setLoading(true);
    try {
      const account = window.starknet.account;
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, account);

      // reveal_bid(job_id, price, timeline, salt)
      const { transaction_hash } = await contract.reveal_bid(
          BigInt(job.onchain_id), 
          BigInt(secretData.price), 
          BigInt(secretData.timeline || secretData.timeframe), 
          BigInt(secretData.salt)
      );
      
      alert("Bid Successfully Revealed! Hash: " + transaction_hash);
      if (onUpdate) onUpdate();
      navigate("/ExploreMarket");
    } catch (e) { 
        alert("Reveal Failed: " + e.message); 
    } finally { setLoading(false); }
  };

  // --- EMPLOYER: Hire Winner ---
  const handleHireWinner = async (winnerAddr) => {
    setLoading(true);
    try {
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, window.starknet.account);
      await contract.select_winner(BigInt(job.onchain_id), winnerAddr);
      
      await fetch(`${API_BASE}${job.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED", winner: winnerAddr })
      });

      alert("Hired Successfully!");
      if (onUpdate) onUpdate();
      navigate("/ExploreMarket");
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div className="cancelbtn">
            <button type="button" onClick={() => navigate(-1)}>✕</button>
        </div>
        
        <h1 className="projh">{job.title}</h1>
        <p style={{marginTop: '10px'}}>{job.description}</p>
        <p style={{fontSize: '11px', color: 'gray', marginTop: '5px'}}>On-chain ID: {job.onchain_id || "Unsynced"}</p>
        <hr style={{margin: '20px 0', border: '0', borderTop: '1px solid var(--divider)'}} />

        {/* PHASE 1: BIDDING */}
        {status === "BIDDING" && (
          isOwner ? (
             <div style={{textAlign:'center'}}>
               <button className="btn2" onClick={() => handleUpdateStatus("REVEAL", "start_reveal_phase")} disabled={loading}>
                 {loading ? "Processing..." : "Start Reveal Phase"}
               </button>
             </div>
          ) : <BidForm job={job} address={address} />
        )}

        {/* PHASE 2: REVEAL (THE FIX IS HERE) */}
        {status === "REVEAL" && (
          <div style={{textAlign: 'center'}}>
            <h3 style={{color: '#f59e0b', marginBottom: '10px'}}>Phase 2: Reveal Phase Active</h3>
            
            {isOwner ? (
                <>
                    <p style={{marginBottom: '15px'}}>Waiting for bidders to unseal their hashes.</p>
                    <button className="btn2" onClick={() => handleUpdateStatus("SHORTLISTED", "finalize_and_shortlist")} disabled={loading}>
                        Close & Run Shortlist
                    </button>
                </>
            ) : hasMyBid ? (
                <>
                    <p style={{marginBottom: '15px'}}>Reveal your original bid values to the employer.</p>
                    <button className="btn2" onClick={handleRevealBid} disabled={loading}>
                        {loading ? "Unsealing..." : "Reveal My Bid"}
                    </button>
                </>
            ) : (
                <p>Waiting for freelancers to finalize...</p>
            )}
          </div>
        )}

        {/* PHASE 3: SHORTLISTED */}
        {status === "SHORTLISTED" && (
            <div style={{textAlign: 'center'}}>
                <h3>Top Ranked Candidates</h3>
                <div className="bids-list" style={{marginTop: '20px'}}>
                    {job.bids?.map(b => (
                        <div key={b.id} className="bid-row" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '10px'}}>
                            <span style={{fontFamily: 'monospace'}}>{b.bidder_address.slice(0, 12)}...</span>
                            {isOwner && (
                                <button className="prove1" onClick={() => handleHireWinner(b.bidder_address)}>Hire</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {(status === "COMPLETED" || status === "FINALIZED") && (
            <div style={{textAlign:'center'}}>
                <h2 style={{color: '#10b981'}}>✔ Project Finalized</h2>
                <p>This job has been completed.</p>
            </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(7, 12, 35, 0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 };
const modalStyle = { background: "var(--Navbar-bg)", padding: "40px", borderRadius: "15px", width: "95%", maxWidth: "600px", color: "white", border: "1px solid var(--border-main)", maxHeight: '90vh', overflowY: 'auto' };

export default JobDetail;