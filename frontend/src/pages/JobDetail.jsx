import { useNavigate, useParams } from "react-router-dom";
import BidForm from "../components/BidForm";
import React, { useState } from "react";
import { Contract } from "starknet";
import ABI_FILE from "../abi.json";
import { normalizeAddress } from "../services/blockchainUtils";
import "./JobDetail.css";

const CONTRACT_ADDRESS = "0x07d4764a30d3eb83c00730c059b71b796692f292e94fc6eb2c20dea4da2b10ae";
const JOBS_API_URL = "https://fairlance.onrender.com/api/jobs/";
const BIDS_API_URL = "https://fairlance.onrender.com/api/bids/";

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

  // Find the specific bid object in the database for the current freelancer
  const myBidInDB = job.bids?.find(b => normalizeAddress(b.bidder_address) === userAddr);

  const handleUpdateStatus = async (newStatus, blockchainFn) => {
    if (!isOwner) return alert("Only the employer can trigger this phase.");
    setLoading(true);
    try {
      const account = window.starknet.account;
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, account);
      await contract[blockchainFn](BigInt(job.onchain_id));
      
      // Update Django Status
      await fetch(`${JOBS_API_URL}${job.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
      });

      alert(`Success! Phase changed to ${newStatus}`);
      if (onUpdate) onUpdate();
      navigate("/ExploreMarket");
    } catch (e) { alert("Transaction Failed: " + e.message); } finally { setLoading(false); }
  };

  const handleRevealBid = async () => {
    const secretData = JSON.parse(localStorage.getItem(`bid_${job.onchain_id}_${address}`));
    if (!secretData) return alert("Secret salt not found. Did you bid on this browser?");

    setLoading(true);
    try {
      const account = window.starknet.account;
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, account);

      // 1. CALL BLOCKCHAIN (Signs the transaction)
      const { transaction_hash } = await contract.reveal_bid(
          BigInt(job.onchain_id), 
          BigInt(secretData.price), 
          BigInt(secretData.timeline || secretData.timeframe), 
          BigInt(secretData.salt)
      );

      // 2. UPDATE BACKEND (Because we have no indexer, we must send the data manually)
      if (myBidInDB) {
          console.log("Syncing revealed values to Django...");
          await fetch(`${BIDS_API_URL}${myBidInDB.id}/`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  price: secretData.price,
                  timeline: secretData.timeline || secretData.timeframe,
                  revealed_at: new Date().toISOString()
              })
          });
      }
      
      alert("Bid Revealed and Synced to Backend! Hash: " + transaction_hash);
      if (onUpdate) onUpdate();
      navigate("/ExploreMarket");
    } catch (e) { 
        alert("Reveal Failed: " + e.message); 
    } finally { setLoading(false); }
  };

  const handleHireWinner = async (winnerAddr) => {
    setLoading(true);
    try {
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, window.starknet.account);
      await contract.select_winner(BigInt(job.onchain_id), winnerAddr);
      await fetch(`${JOBS_API_URL}${job.id}/`, {
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
        <hr style={{margin: '25px 0', border: '0', borderTop: '1px solid var(--divider)'}} />

        {status === "BIDDING" && (
          isOwner ? (
             <div style={{textAlign:'center'}}>
               <button className="btn2" onClick={() => handleUpdateStatus("REVEAL", "start_reveal_phase")} disabled={loading}>
                 Start Reveal Phase
               </button>
             </div>
          ) : <BidForm job={job} address={address} />
        )}

        {status === "REVEAL" && (
          <div style={{textAlign: 'center'}}>
            <h3>Phase 2: Reveal Phase Active</h3>
            {isOwner ? (
                <button className="btn2" onClick={() => handleUpdateStatus("SHORTLISTED", "finalize_and_shortlist")} disabled={loading}>
                    Close & Run Shortlist
                </button>
            ) : myBidInDB ? (
                <button className="btn2" onClick={handleRevealBid} disabled={loading}>
                    {loading ? "Unsealing..." : "Reveal My Bid"}
                </button>
            ) : <p>Waiting for freelancers to reveal...</p>}
          </div>
        )}

        {status === "SHORTLISTED" && (
            <div style={{textAlign: 'center'}}>
                <h3>Top Ranked Candidates</h3>
                <div className="bids-list" style={{marginTop: '20px'}}>
                    {job.bids?.map(b => (
                        <div key={b.id} className="bid-row" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '10px'}}>
                            <span style={{fontFamily: 'monospace'}}>{b.bidder_address.slice(0, 12)}...</span>
                            {isOwner && <button className="prove1" onClick={() => handleHireWinner(b.bidder_address)}>Hire</button>}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(7, 12, 35, 0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 };
const modalStyle = { background: "var(--Navbar-bg)", padding: "40px", borderRadius: "15px", width: "95%", maxWidth: "600px", color: "white", border: "1px solid var(--border-main)", maxHeight: '85vh', overflowY: 'auto' };

export default JobDetail;