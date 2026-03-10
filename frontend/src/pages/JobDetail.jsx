import { useNavigate, useParams } from "react-router-dom";
import BidForm from "../components/BidForm";
import React, { useState } from "react";
import { Contract } from "starknet";
import ABI_FILE from "../abi.json";
import { normalizeAddress } from "../services/blockchainUtils";
import "./JobDetail.css";

const CONTRACT_ADDRESS = "0x07d4764a30d3eb83c00730c059b71b796692f292e94fc6eb2c20dea4da2b10ae";
const API_BASE = "https://fairlance.onrender.com/api/jobs/";

function JobDetail({ jobs, address, role }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  const job = jobs?.find(j => j && (String(j.id) === id || String(j.onchain_id) === id));
  if (!job) return null;

  const userAddr = normalizeAddress(address);
  const isOwner = userAddr === normalizeAddress(job.employer_address);
  const status = job.status?.toUpperCase();
  const actualAbi = ABI_FILE.abi || ABI_FILE;

  // --- PHASE 1 -> 2: Start Reveal (Employer) ---
  const handleStartReveal = async () => {
    setLoading(true);
    try {
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, window.starknet.account);
      await contract.start_reveal_phase(job.onchain_id);
      // Backend Shortcut (since no event exists for this specific function)
      await fetch(`${API_BASE}${job.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "REVEAL" })
      });
      alert("Reveal Phase Started!");
      window.location.reload();
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  // --- PHASE 2: Reveal Bid (Freelancer) ---
  const handleRevealBid = async () => {
    const data = JSON.parse(localStorage.getItem(`bid_${job.onchain_id}_${address}`));
    if (!data) return alert("Salt/Price not found in this browser.");

    setLoading(true);
    try {
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, window.starknet.account);
      const { transaction_hash } = await contract.reveal_bid(job.onchain_id, data.price, data.timeline, data.salt);
      alert("Bid Unsealed on Blockchain! Hash: " + transaction_hash);
      navigate("/ExploreMarket");
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  // --- PHASE 2 -> 3: Finalize & Shortlist (Employer) ---
  const handleShortlist = async () => {
    setLoading(true);
    try {
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, window.starknet.account);
      const { transaction_hash } = await contract.finalize_and_shortlist(job.onchain_id);
      alert("Shortlisting algorithm triggered on-chain! Wait for Indexer to sync Top 5. Hash: " + transaction_hash);
      navigate("/MyProjects");
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  // --- PHASE 3 -> 4: Select Winner (Employer) ---
  const handleSelectWinner = async (winnerAddr) => {
    setLoading(true);
    try {
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, window.starknet.account);
      const { transaction_hash } = await contract.select_winner(job.onchain_id, winnerAddr);
      alert("Winner Selected! Contract Finalized. Hash: " + transaction_hash);
      navigate("/ExploreMarket");
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button className="cancelbtn" onClick={() => navigate(-1)} style={{float:'right'}}>✕</button>
        <h1 className="projh">{job.title}</h1>
        <p>{job.description}</p>
        <hr style={{margin: '20px 0', border: '0', borderTop: '1px solid var(--divider)'}} />

        {/* STATUS: BIDDING */}
        {status === "BIDDING" && (
          isOwner ? <button className="btn2" onClick={handleStartReveal} disabled={loading}>Start Reveal Phase</button> 
                  : <BidForm job={job} address={address} />
        )}

        {/* STATUS: REVEAL */}
        {status === "REVEAL" && (
          <div style={{textAlign: 'center'}}>
            <h3>Reveal Phase Active</h3>
            {isOwner ? (
                <button className="btn2" onClick={handleShortlist} disabled={loading}>Run On-Chain Shortlist</button>
            ) : job.bids?.some(b => normalizeAddress(b.bidder_address) === userAddr) ? (
                <button className="btn2" onClick={handleRevealBid} disabled={loading}>Reveal My Bid</button>
            ) : <p>Waiting for reveals...</p>}
          </div>
        )}

        {/* STATUS: SHORTLISTED */}
        {status === "SHORTLISTED" && (
            <div style={{textAlign:'center'}}>
                <h3>Top Ranked Candidates</h3>
                {job.bids?.filter(b => b.is_shortlisted).map(b => (
                    <div key={b.bidder_address} className="bid-row" style={{margin:'10px 0', padding:'10px', background:'rgba(255,255,255,0.05)'}}>
                        <span>{b.bidder_address.slice(0,10)}...</span>
                        {isOwner && <button className="prove1" onClick={() => handleSelectWinner(b.bidder_address)}>Hire</button>}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(11, 21, 33, 0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 };
const modalStyle = { background: "var(--Navbar-bg)", padding: "40px", borderRadius: "15px", width: "95%", maxWidth: "600px", color: "white", border: "1px solid var(--border-main)", maxHeight: '85vh', overflowY: 'auto' };

export default JobDetail;