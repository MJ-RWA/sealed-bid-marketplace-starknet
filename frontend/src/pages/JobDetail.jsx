import { Outlet, useNavigate, useParams } from "react-router-dom";
import BidForm from "../components/BidForm";
import { Link } from "react-router-dom";
import "./JobDetail.css"
import { useState, useEffect, useCallback } from "react";

function JobDetail({ jobs, setJobs, address, onSubmitReveal, role }) {
  const navigate = useNavigate();
  const { id } = useParams();

  // Find the job by DB ID or Onchain ID (robust matching)
  const job = jobs?.find(j => j && (String(j.id) === id || String(j.onchain_id) === id));

  const changeStatus = useCallback((newStatus) => {
    if (!job) return;
    setJobs(prev =>
      prev.map(j => (j.id === job.id ? { ...j, status: newStatus } : j))
    );
  }, [job, setJobs]);

  useEffect(() => {
    if (job && job.status?.toUpperCase() === "BIDDING" && job.deadline) {
      const checkDeadline = () => {
        const now = Date.now();
        const deadlineTime = new Date(job.deadline).getTime();
        if (now >= deadlineTime) {
          changeStatus("REVEAL");
        }
      };
      checkDeadline();
      const interval = setInterval(checkDeadline, 1000);
      return () => clearInterval(interval);
    }
  }, [job, changeStatus]);

  const handleCommitBid = (bidData) => {
    if (!job) return;
    setJobs(prev => prev.map(j => {
      if (j.id === job.id) {
        return { ...j, bids: [...(j.bids || []), bidData] };
      }
      return j;
    }));
  };

  // 1. FALLBACK: If job is still loading or not found
  if (!job) {
    return (
      <div style={overlayStyle}>
        <div className="jobdetail" style={modalStyle}>
          <div className="cancelbtn"><button onClick={() => navigate(-1)}>✕</button></div>
          <div style={{textAlign: 'center', padding: '40px'}}>
            <h2>Job Not Found</h2>
            <p style={{color: 'gray'}}>ID: {id}</p>
            <button onClick={() => navigate(-1)} style={{marginTop: '20px', color: 'cyan'}}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  // Normalize status for comparisons
  const currentStatus = job.status?.toUpperCase() || "BIDDING";

  // 2. BIDDING PHASE
  if (currentStatus === "BIDDING") {
    return (
      <div style={overlayStyle}>
        <div className="jobdetail" style={modalStyle}>
          <div className="cancelbtn"><button onClick={() => navigate(-1)}>✕</button></div> 
          <h1>{job.title}</h1>
          <p>{job.description}</p>
          <hr />
          <span className="apply">Apply for this job by submitting your bid</span>
          <BidForm job={job} address={address} onSubmitBid={handleCommitBid} />
          <Outlet />
        </div>
      </div>
    );
  }

  // 3. REVEAL PHASE
  if (currentStatus === "REVEAL") {
    return (
      <div style={overlayStyle}>
        <div className="jobdetail" style={modalStyle}>
          <div className="cancelbtn"><button onClick={() => navigate(-1)}>✕</button></div>
          <h1>{job.title}</h1>
          <p>{job.description}</p>
          <hr />
          <h3 style={{marginBottom: '15px'}}>Bids in Reveal Phase</h3>
          {job.bids?.length > 0 ? job.bids.map((b) => (
            <div key={b.bidder} className="bid-row" style={{padding: '10px', borderBottom: '1px solid #333'}}>
              <span>{b.bidder?.slice(0, 8)}...</span>
              {b.revealed ? <span style={{color: 'green'}}>✅ Revealed</span> : <span style={{color: 'orange'}}>🔒 Locked</span>}
            </div>
          )) : <p>No bids received yet.</p>}
        </div>
      </div>
    );
  }

  // 4. COMPLETED PHASE
  if (currentStatus === "COMPLETED" || currentStatus === "FINALIZED") {
    return (
      <div style={overlayStyle}>
        <div className="jobdetail" style={modalStyle}>
          <div className="cancelbtn"><button onClick={() => navigate(-1)}>✕</button></div> 
          <h1>{job.title}</h1>
          <p>Job Closed</p>
          <div className="status-card neutral">
             <h3>Job Awarded</h3>
             <p>This project has been finalized on-chain.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(11, 21, 33, 0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalStyle = { background: "var(--Navbar-bg)", padding: "30px", borderRadius: "12px", width: "90%", maxWidth: "600px", color: "white" };

export default JobDetail;