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

  // --- GENERAL STATUS UPDATER (Start Reveal, Finalize Shortlist) ---
  const handleUpdateStatus = async (newStatus, blockchainFn) => {
    // PRE-CHECK: Ensure wallet matches employer for this specific Job ID
    if (!isOwner) {
        return alert(`Error: Your connected wallet (${address.slice(0,6)}) does not match the employer address for Job #${job.onchain_id}. Please switch accounts in ArgentX.`);
    }

    setLoading(true);
    try {
      const account = window.starknet.account;
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, account);
      
      // 1. CALL BLOCKCHAIN (Using BigInt to prevent type errors)
      console.log(`Calling ${blockchainFn} for On-chain ID: ${job.onchain_id}`);
      const tx = await contract[blockchainFn](BigInt(job.onchain_id));
      console.log("Blockchain Success! Hash:", tx.transaction_hash);
      
      // 2. DIRECT BACKEND UPDATE (Manual sync because no indexer)
      await fetch(`${API_BASE}${job.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
      });

      alert(`Success! Job is now in the ${newStatus} phase.`);
      if (onUpdate) onUpdate(); // Refresh the global jobs list
      navigate("/ExploreMarket");
    } catch (e) { 
        console.error("Workflow Error:", e);
        alert("Transaction Failed: " + e.message); 
    } finally { 
        setLoading(false); 
    }
  };

  // --- FREELANCER: Reveal Bid ---
  const handleRevealBid = async () => {
    const secretData = JSON.parse(localStorage.getItem(`bid_${job.onchain_id}_${address}`));
    if (!secretData) return alert("Secret salt/price not found in this browser. Did you bid using a different computer?");

    setLoading(true);
    try {
      const account = window.starknet.account;
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, account);

      // reveal_bid(job_id, price, timeline, salt)
      console.log("Unsealing bid on-chain...");
      const { transaction_hash } = await contract.reveal_bid(
          BigInt(job.onchain_id), 
          BigInt(secretData.price), 
          BigInt(secretData.timeline), 
          BigInt(secretData.salt)
      );
      
      alert("Bid Successfully Revealed! Hash: " + transaction_hash);
      if (onUpdate) onUpdate();
      navigate("/ExploreMarket");
    } catch (e) { 
        console.error(e);
        alert("Reveal Failed: " + e.message); 
    } finally { 
        setLoading(false); 
    }
  };

  // --- EMPLOYER: Hire Winner ---
  const handleHireWinner = async (winnerAddr) => {
    setLoading(true);
    try {
      const account = window.starknet.account;
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, account);
      
      // 1. Blockchain Call
      const { transaction_hash } = await contract.select_winner(BigInt(job.onchain_id), winnerAddr);
      
      // 2. Backend Update
      await fetch(`${API_BASE}${job.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED", winner: winnerAddr })
      });

      alert("Freelancer Hired! Project is now active.");
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
        <p style={{marginTop: '10px', color: 'var(--text-secondary)'}}>{job.description}</p>
        <hr style={{margin: '25px 0', border: '0', borderTop: '1px solid var(--divider)'}} />

        {/* PHASE 1: BIDDING */}
        {status === "BIDDING" && (
          isOwner ? (
             <div style={{textAlign:'center', padding: '20px'}}>
               <p style={{marginBottom: '20px'}}>You have received {job.bids?.length || 0} sealed bids.</p>
               <button className="btn2" onClick={() => handleUpdateStatus("REVEAL", "start_reveal_phase")} disabled={loading}>
                 {loading ? "Processing..." : "Start Reveal Phase"}
               </button>
             </div>
          ) : <BidForm job={job} address={address} />
        )}

        {/* PHASE 2: REVEAL */}
        {status === "REVEAL" && (
          <div style={{textAlign: 'center', padding: '20px'}}>
            <h3 style={{color: '#f59e0b', marginBottom: '10px'}}>Phase 2: Reveal Phase Active</h3>
            {isOwner ? (
                <>
                    <p style={{marginBottom: '20px'}}>Bidders are currently unsealing their prices.</p>
                    <button className="btn2" onClick={() => handleUpdateStatus("SHORTLISTED", "finalize_and_shortlist")} disabled={loading}>
                        {loading ? "Processing..." : "Close & Run Shortlist"}
                    </button>
                </>
            ) : (
                job.bids?.some(b => normalizeAddress(b.bidder_address) === userAddr) ? (
                    <button className="btn2" onClick={handleRevealBid} disabled={loading}>
                        {loading ? "Unsealing..." : "Reveal My Bid"}
                    </button>
                ) : <p>You did not participate in this bidding cycle.</p>
            )}
          </div>
        )}

        {/* PHASE 3: SHORTLISTED */}
        {status === "SHORTLISTED" && (
            <div style={{textAlign: 'center'}}>
                <h3>Top 5 Ranked Candidates</h3>
                <p style={{fontSize: '0.8rem', color: 'gray', marginBottom: '20px'}}>Ranked by your set priority (Price vs. Time)</p>
                <div className="bids-list">
                    {job.bids?.map(bid => (
                        <div key={bid.id} className="bid-row" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '10px'}}>
                            <span style={{fontFamily: 'monospace'}}>{bid.bidder_address.slice(0, 12)}...</span>
                            {isOwner && (
                                <button className="prove1" onClick={() => handleHireWinner(bid.bidder_address)}>
                                    Hire
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* PHASE 4: COMPLETED */}
        {(status === "COMPLETED" || status === "FINALIZED") && (
            <div style={{textAlign:'center', padding: '30px'}}>
                <h2 style={{color: '#10b981'}}>✔ Project Assigned</h2>
                <p style={{marginTop: '10px'}}>This job has been finalized on the Starknet blockchain.</p>
            </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(7, 12, 35, 0.85)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalStyle = {
  background: "var(--Navbar-bg)",
  padding: "40px",
  borderRadius: "15px",
  width: "95%",
  maxWidth: "600px",
  color: "var(--text-primary)",
  border: "1px solid var(--border-main)",
  maxHeight: "90vh",
  overflowY: "auto"
};

export default JobDetail;