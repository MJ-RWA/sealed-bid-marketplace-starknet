import { useNavigate, useParams } from "react-router-dom";
import BidForm from "../components/BidForm";
import React, { useState } from "react";
import { Contract } from "starknet";
import ABI_FILE from "../abi.json";
import "./JobDetail.css";

const CONTRACT_ADDRESS = "0x07d4764a30d3eb83c00730c059b71b796692f292e94fc6eb2c20dea4da2b10ae";

function JobDetail({ jobs, address, role, setJobs }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  const job = jobs?.find(j => j && (String(j.id) === id || String(j.onchain_id) === id));
  
  if (!job) return null;

  const normalize = (addr) => addr ? BigInt(addr).toString(16).toLowerCase() : "";
  const isOwner = normalize(address) === normalize(job.employer_address);
  const status = job.status?.toUpperCase();

  const handleStartReveal = async () => {
    setLoading(true);
    try {
      const contract = new Contract(ABI_FILE.abi || ABI_FILE, CONTRACT_ADDRESS, window.starknet.account);
      const { transaction_hash } = await contract.start_reveal_phase(job.onchain_id);
      alert("Reveal Phase Started! Hash: " + transaction_hash);
      navigate("/ExploreMarket");
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  const handleRevealBid = async () => {
    const secretData = JSON.parse(localStorage.getItem(`bid_${job.onchain_id}_${address}`));
    if (!secretData) return alert("Secret salt not found. Did you bid using this browser?");

    setLoading(true);
    try {
      const contract = new Contract(ABI_FILE.abi || ABI_FILE, CONTRACT_ADDRESS, window.starknet.account);
      const { transaction_hash } = await contract.reveal_bid(job.onchain_id, secretData.price, secretData.timeline, secretData.salt);
      alert("Bid Revealed! Hash: " + transaction_hash);
      navigate("/ExploreMarket");
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button className="cancelbtn" onClick={() => navigate(-1)} style={{float:'right'}}>✕</button>
        <h1 className="projh">{job.title}</h1>
        <p style={{marginTop: '10px'}}>{job.description}</p>
        <hr style={{margin: '20px 0', border: '0', borderTop: '1px solid var(--divider)'}} />

        {status === "BIDDING" && (
          isOwner ? (
             <div style={{textAlign:'center'}}>
               <p>Bidding in progress...</p>
               <button className="btn2" onClick={handleStartReveal} disabled={loading} style={{marginTop:'15px'}}>
                 {loading ? "Processing..." : "Start Reveal Phase"}
               </button>
             </div>
          ) : <BidForm job={job} address={address} />
        )}

        {status === "REVEAL" && (
          <div style={{textAlign: 'center'}}>
            <h3>Phase 2: Reveal Phase Active</h3>
            {job.bids?.some(b => normalize(b.bidder_address) === normalize(address)) ? (
                <button className="btn2" onClick={handleRevealBid} disabled={loading} style={{marginTop:'15px'}}>
                  {loading ? "Unsealing..." : "Reveal My Bid"}
                </button>
            ) : <p>The employer has started the Reveal Phase. Waiting for bids to be unsealed.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(11, 21, 33, 0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 };
const modalStyle = { background: "var(--Navbar-bg)", padding: "40px", borderRadius: "15px", width: "95%", maxWidth: "600px", color: "white", border: "1px solid var(--border-main)", maxHeight: '90vh', overflowY: 'auto' };

export default JobDetail;