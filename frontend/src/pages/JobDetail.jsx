import { useNavigate, useParams } from "react-router-dom";
import BidForm from "../components/BidForm";
import React, { useState } from "react";
import { Contract } from "starknet";
import ABI_FILE from "../abi.json";
import { normalizeAddress } from "../services/blockchainUtils";
import "./JobDetail.css";

const CONTRACT_ADDRESS = "0x07d4764a30d3eb83c00730c059b71b796692f292e94fc6eb2c20dea4da2b10ae";
const JOBS_API_URL = "https://fairlance.onrender.com/api/jobs/";

function JobDetail({ jobs, address, role, setJobs }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  const job = jobs?.find(j => j && (String(j.id) === id || String(j.onchain_id) === id));
  if (!job) return null;

  const userAddr = normalizeAddress(address);
  const employerAddr = normalizeAddress(job.employer_address);
  const isOwner = userAddr === employerAddr;
  const status = job.status?.toUpperCase();

  // --- EMPLOYER: Start Reveal Phase ---
  const handleStartReveal = async () => {
    setLoading(true);
    try {
      const account = window.starknet.account;
      const actualAbi = ABI_FILE.abi || ABI_FILE;
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, account);
      
      // 1. CALL BLOCKCHAIN
      console.log("Starting Reveal Phase on Starknet...");
      const { transaction_hash } = await contract.start_reveal_phase(job.onchain_id);
      
      // 2. UPDATE BACKEND DIRECTLY (Because contract doesn't emit an event)
      console.log("Updating Backend status to REVEAL...");
      await fetch(`${JOBS_API_URL}${job.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "REVEAL" })
      });

      alert("Reveal Phase Started!\n\n1. Blockchain updated.\n2. Backend synced.");
      
      // Navigate to refresh the list
      window.location.reload(); 
    } catch (e) { 
        console.error(e);
        alert("Error: " + e.message); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleRevealBid = async () => {
    // Look for secrets in LocalStorage
    const secretData = JSON.parse(localStorage.getItem(`bid_${job.onchain_id}_${address}`));
    if (!secretData) return alert("Secret data (salt/price) not found in this browser.");

    setLoading(true);
    try {
      const account = window.starknet.account;
      const actualAbi = ABI_FILE.abi || ABI_FILE;
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, account);

      // reveal_bid(job_id, price, timeline, salt)
      const { transaction_hash } = await contract.reveal_bid(
          job.onchain_id, 
          secretData.price, 
          secretData.timeline, 
          secretData.salt
      );

      // Update backend to show this specific bid is now revealed
      // (Optional: Your indexer should handle the BidRevealed event if you have one)
      
      alert("Bid Successfully Revealed! Hash: " + transaction_hash);
      navigate("/ExploreMarket");
    } catch (e) { alert("Reveal Failed: " + e.message); } finally { setLoading(false); }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button className="cancelbtn" onClick={() => navigate(-1)} style={{float:'right'}}>✕</button>
        <h1 className="projh">{job.title}</h1>
        <p>{job.description}</p>
        <hr style={{margin: '20px 0', border: '0', borderTop: '1px solid var(--divider)'}} />

        {/* CASE 1: BIDDING PHASE */}
        {status === "BIDDING" && (
          isOwner ? (
             <div style={{textAlign:'center'}}>
               <p style={{marginBottom: '15px'}}>Bidding is active. Once you have enough bids, click below to start the reveal phase.</p>
               <button className="btn2" onClick={handleStartReveal} disabled={loading}>
                 {loading ? "Processing..." : "Start Reveal Phase"}
               </button>
             </div>
          ) : <BidForm job={job} address={address} />
        )}

        {/* CASE 2: REVEAL PHASE */}
        {status === "REVEAL" && (
          <div style={{textAlign: 'center'}}>
            <h3 style={{color: '#f59e0b'}}>Phase 2: Reveal Phase Active</h3>
            <p style={{margin: '10px 0'}}>The employer is waiting for bids to be unsealed.</p>
            
            {job.bids?.some(b => normalizeAddress(b.bidder_address) === userAddr) ? (
                <button className="btn2" onClick={handleRevealBid} disabled={loading}>
                  {loading ? "Unsealing..." : "Reveal My Bid"}
                </button>
            ) : (
                <p style={{fontSize: '0.8rem', color: 'gray'}}>You did not submit a bid for this job.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(11, 21, 33, 0.9)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 };
const modalStyle = { background: "var(--Navbar-bg)", padding: "40px", borderRadius: "15px", width: "95%", maxWidth: "600px", color: "white", border: "1px solid var(--border-main)", maxHeight: '85vh', overflowY: 'auto' };

export default JobDetail;