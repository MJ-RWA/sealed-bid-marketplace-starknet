import { Outlet, useNavigate, useParams } from "react-router-dom";
import BidForm from "../components/BidForm";
import { Link } from "react-router-dom";
import "./JobDetail.css"
import { useState, useEffect, useCallback } from "react";

function JobDetail({ jobs, setJobs, address, onSubmitReveal, role }) {
  const navigate = useNavigate();
  const { id } = useParams();

  // THE FIX: Find by ID (Number) or Onchain ID
  const job = jobs?.find(j => j && (j.id === Number(id) || j.onchain_id === Number(id)));

  const changeStatus = useCallback((newStatus) => {
    if (!job) return;
    setJobs(prev =>
      prev
      .filter(Boolean)
      .map(j => 
        j.id === job.id
        ? { ...j, status: newStatus }
        : j 
      )
    );
  }, [job, setJobs]);

  useEffect(() => {
    if (job && job.status === "BIDDING" && job.deadline) {
      const checkDeadline = () => {
        const now = Date.now();
        const deadlineTime = new Date(job.deadline).getTime();
        if (now >= deadlineTime) {
          console.log("Deadline reached! Switching to REVEAL mode.");
          changeStatus("REVEAL");
        }
      };
      
      checkDeadline();
      const interval = setInterval(checkDeadline, 1000);
      return () => clearInterval(interval);
    }
  }, [job, changeStatus]);

  function handleReveal(bid) {
    const updatedJob = {
      ...job,
      bids: job.bids.map(b =>
        b.bidder === bid.bidder ? { ...b, revealed: true } : b
      )
    };
    if (onSubmitReveal) onSubmitReveal(updatedJob);
    alert("Bid revealed!");
  }

  const handleCommitBid = (bidData) => {
    if (!job) return;
    setJobs(prev =>
      prev.map(j => {
        if (!j) return j;
        if (j.id === job.id) {
          return {
            ...j,
            bids: [...(j.bids || []), bidData],
            status: "BIDDING"
          };
        }
        return j;
      })
    );
  };

  // THE CRITICAL UI FIX: If job is not found yet (loading), don't return null.
  if (!job) {
    return (
      <div style={overlayStyle}>
        <div className="jobdetail" style={modalStyle}>
          <div className="cancelbtn"><button onClick={() => navigate(-1)}>✕</button></div>
          <p style={{ textAlign: 'center', padding: '20px' }}>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (job.status === "BIDDING") {
    return (
      <div style={overlayStyle}>
        <div className="jobdetail" style={modalStyle}>
          <div className="cancelbtn"><button onClick={() => navigate(-1)}>✕</button></div> 
          <h1>{job.title}</h1>
          <p>{job.description}</p>
          <hr />
          <span className="apply">Apply for this job by submitting your bid</span>
          <BidForm job={job} jobs={jobs} setJobs={setJobs} address={address} onSubmitBid={handleCommitBid} />
          <Outlet />
        </div>
      </div>
    );
  }

  if (job.status === "REVEAL") {
    return (
      <div style={overlayStyle}>
        <div className="jobdetail" style={modalStyle}>
          <div className="cancelbtn"><button onClick={() => navigate(-1)}>✕</button></div>
          <h1 style={{ marginBottom: '10px' }}>{job.title}</h1>
          <p style={{ opacity: 0.8, marginBottom: '20px' }}>{job.description}</p>
          <hr style={{ border: '0', borderTop: '1px solid #eee', marginBottom: '20px' }}/>

          {job?.bids?.length > 0 ? job.bids.map((b) => {
            const isEmployer = role === "employer";
            const isMyBid = address === b.bidder;

            return (
              <div key={b.bidder} className="bid-row">
                <span style={{ fontWeight: '500', fontFamily: 'monospace' }}>
                  {b.bidder?.slice(0, 6)}...{b.bidder?.slice(-4)}
                </span>
                {!b.revealed && (
                  <div className="reveal-container">
                    {address === b.bidder ? (
                      <button className="prove1" onClick={() => handleReveal(b)}>Reveal My Bid</button>
                    ) : (
                      <span className="text-slate-500 italic">Waiting for bidder...</span>
                    )}
                  </div>
                )}
                {b.revealed && (
                  <div className="revealed-data">
                    {isEmployer || isMyBid ? (
                      <>
                        <strong>Amount:</strong> {b.amount} STRK <br />
                        <strong> Time:</strong> {b.timeframe} Week<br />
                        <strong> Proposal:</strong> {b.proposal}
                      </>
                    ) : (
                      <span style={{ color: "#16a34a", fontWeight: "600" }}>✅ Revealed</span>
                    )}
                  </div>
                )}
              </div>
            );
          }) : <p>No bids to reveal yet.</p>}
        </div>
      </div>
    );
  }

  if (job.status === "COMPLETED") {
    const isWinner = job.winner === address;
    const isOwner = job.employer_address === address;

    return (
      <div style={overlayStyle}>
        <div className="jobdetail" style={modalStyle}> 
          <div className="cancelbtn"><button onClick={() => navigate(-1)}>✕</button></div> 
          <h1>{job.title}</h1>
          <p>{job.description}</p>
          <hr />
          {isWinner ? (
            <div className="status-card success">
              <h3>Congratulations!</h3>
              <p>You have been hired for this Job.</p>
            </div>
          ) : isOwner ? (
            <div className="status-card owner">
              <h3>Job Assigned</h3>
              <p>You hired <strong>{job.winner?.slice(0,8)}...</strong></p>
            </div>
          ) : (
            <div className="status-card neutral">
              <h3>Job Closed</h3>
              <p>This job has been awarded to another bidder.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(11, 21, 33, 0.6)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "var(--Navbar-bg)",
  padding: "20px",
  borderRadius: "8px",
  width: "90%",
  maxWidth: "600px",
};

export default JobDetail;