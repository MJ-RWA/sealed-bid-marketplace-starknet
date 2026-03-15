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

  const handleUpdateStatus = async (newStatus, blockchainFn) => {
    // DIAGNOSTIC LOGS
    console.log("--- STARTING PHASE TRANSITION ---");
    console.log("Calling Function:", blockchainFn);
    console.log("Sending On-chain ID:", job.onchain_id);
    console.log("Signing with Account:", address);

    if (!isOwner) return alert("Error: Only the employer can trigger this phase.");
    if (!job.onchain_id) return alert("Error: This job has no On-chain ID linked. Please fix in Django Admin.");

    setLoading(true);
    try {
      const account = window.starknet.account;
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, account);
      
      // BLOCKCHAIN CALL
      // We use BigInt to ensure the contract receives a number, not a string
      await contract[blockchainFn](BigInt(job.onchain_id));
      
      // DIRECT BACKEND UPDATE
      await fetch(`${API_BASE}${job.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
      });

      alert(`Success! Phase changed to ${newStatus}`);
      if (onUpdate) onUpdate();
      navigate("/ExploreMarket");
    } catch (e) { 
        console.error("TX FAILED:", e);
        alert("Transaction Failed: " + e.message); 
    } finally { setLoading(false); }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button className="cancelbtn" onClick={() => navigate(-1)} style={{float:'right'}}>✕</button>
        <h1 className="projh">{job.title}</h1>
        <p style={{marginTop: '10px'}}>{job.description}</p>
        <p style={{fontSize: '11px', color: 'gray'}}>On-chain ID: {job.onchain_id || "Unsynced"}</p>
        <hr style={{margin: '20px 0', border: '0', borderTop: '1px solid var(--divider)'}} />

        {status === "BIDDING" && (
          isOwner ? (
              <div style={{textAlign: 'center'}}>
                <button className="btn2" onClick={() => handleUpdateStatus("REVEAL", "start_reveal_phase")} disabled={loading}>
                    {loading ? "Processing..." : "Start Reveal Phase"}
                </button>
              </div>
          ) : <BidForm job={job} address={address} />
        )}

        {status === "REVEAL" && (
          <div style={{textAlign: 'center'}}>
            <p style={{marginBottom: '20px'}}>Reveal phase is active.</p>
            {isOwner ? (
                <button className="btn2" onClick={() => handleUpdateStatus("SHORTLISTED", "finalize_and_shortlist")} disabled={loading}>
                    Close & Shortlist
                </button>
            ) : <p>Waiting for employer to finalize...</p>}
          </div>
        )}

        {status === "SHORTLISTED" && (
            <div style={{textAlign:'center'}}>
                <h3>Shortlisted Candidates</h3>
                {job.bids?.map(b => (
                    <div key={b.id} className="bid-row" style={{padding:'10px', borderBottom: '1px solid #333'}}>
                        <span>{b.bidder_address.slice(0,10)}...</span>
                        {isOwner && <button className="btn2" onClick={() => handleUpdateStatus("COMPLETED", "select_winner")}>Hire</button>}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(11, 21, 33, 0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 };
const modalStyle = { background: "var(--Navbar-bg)", padding: "40px", borderRadius: "15px", width: "95%", maxWidth: "600px", color: "white", border: "1px solid var(--border-main)" };

export default JobDetail;