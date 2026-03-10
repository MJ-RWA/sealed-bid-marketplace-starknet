import { useNavigate, useParams } from "react-router-dom";
import BidForm from "../components/BidForm";
import React, { useState } from "react";
import { Contract } from "starknet";
import ABI_FILE from "../abi.json";
import { normalizeAddress } from "../services/blockchainUtils";
import "./JobDetail.css";

const CONTRACT_ADDRESS = "0x07d4764a30d3eb83c00730c059b71b796692f292e94fc6eb2c20dea4da2b10ae";
const API_BASE = "https://fairlance.onrender.com/api/jobs/";

function JobDetail({ jobs, address, onUpdate }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  const job = jobs?.find(j => j && (String(j.id) === id || String(j.onchain_id) === id));
  if (!job) return null;

  const userAddr = normalizeAddress(address);
  const isOwner = userAddr === normalizeAddress(job.employer_address);
  const status = job.status?.toUpperCase();

  const handleUpdateStatus = async (newStatus, blockchainFn) => {
    setLoading(true);
    try {
      const account = window.starknet.account;
      const contract = new Contract(ABI_FILE.abi || ABI_FILE, CONTRACT_ADDRESS, account);
      
      // 1. BLOCKCHAIN CALL
      const tx = await contract[blockchainFn](job.onchain_id);
      
      // 2. BACKEND UPDATE (Manual sync because no indexer)
      await fetch(`${API_BASE}${job.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
      });

      alert(`Success: ${newStatus} phase active!`);
      if (onUpdate) onUpdate();
      navigate("/ExploreMarket");
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  const handleRevealBid = async () => {
    const data = JSON.parse(localStorage.getItem(`bid_${job.onchain_id}_${address}`));
    setLoading(true);
    try {
      const contract = new Contract(ABI_FILE.abi || ABI_FILE, CONTRACT_ADDRESS, window.starknet.account);
      await contract.reveal_bid(job.onchain_id, data.price, data.timeline, data.salt);
      
      // Update bid status in backend manually
      // find the bid ID first...
      const myBid = job.bids.find(b => normalizeAddress(b.bidder_address) === userAddr);
      await fetch(`https://fairlance.onrender.com/api/bids/${myBid.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_shortlisted: true }) // Simulating reveal
      });

      alert("Bid Revealed!");
      if (onUpdate) onUpdate();
      navigate("/ExploreMarket");
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="jobdetail-modal" style={overlayStyle}>
      <div style={modalStyle}>
        <h1 className="projh">{job.title}</h1>
        <p>{job.description}</p>
        <hr />

        {status === "BIDDING" && (
          isOwner ? <button className="btn2" onClick={() => handleUpdateStatus("REVEAL", "start_reveal_phase")}>Start Reveal Phase</button> 
                  : <BidForm job={job} address={address} />
        )}

        {status === "REVEAL" && (
          <div style={{textAlign: 'center'}}>
            {isOwner ? <button className="btn2" onClick={() => handleUpdateStatus("SHORTLISTED", "finalize_and_shortlist")}>Close & Shortlist</button>
                     : <button className="btn2" onClick={handleRevealBid}>Reveal My Bid</button>}
          </div>
        )}

        {status === "SHORTLISTED" && (
            <div style={{textAlign:'center'}}>
                <h3>Shortlisted Candidates</h3>
                {/* For the demo, we show everyone who revealed */}
                {job.bids?.map(b => (
                    <div key={b.id} className="bid-row">
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
const modalStyle = { background: "var(--Navbar-bg)", padding: "40px", borderRadius: "15px", width: "95%", maxWidth: "600px" };

export default JobDetail;