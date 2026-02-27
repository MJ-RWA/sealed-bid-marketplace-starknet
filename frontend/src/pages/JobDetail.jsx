import { Outlet, useNavigate, useParams } from "react-router-dom";
import BidForm from "../components/BidForm";
import { Link } from "react-router-dom";
import "./JobDetail.css"
import { useState, useEffect } from "react";

function JobDetail({ jobs, setJobs, address, onSubmitReveal }) {
     const navigate = useNavigate();
  const { id } = useParams();

  const job = jobs?.find(j => j && j.id === Number(id));

function changeStatus(newStatus) {
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
}

useEffect(() => {
  // Only check if the job is still in the BIDDING phase
  if (job && job.status === "BIDDING" && job.deadline) {
    const checkDeadline = () => {
      const now = Date.now();
      if (now >= job.deadline) {
        console.log("Deadline reached! Switching to REVEAL mode.");
        changeStatus("REVEAL");
      }
    };

    // 1. Check immediately when the component loads
    checkDeadline();

    // 2. Set an interval to check every second (for live countdowns)
    const interval = setInterval(checkDeadline, 1000);

    return () => clearInterval(interval); // Cleanup
  }
}, [job, changeStatus]);

// const handleReveal = (bid) => {
//   const updatedJobs = jobs.map(j => {
//     if (j.id !== job.id) return j;

//     return {
//       ...j,
//       bids: j.bids.map(b =>
//         b.bidder === bid.bidder ? { ...b, revealed: true } : b
//       )
//     };
//   });
//   setJobs(updatedJobs);
// };
  
function handleReveal(bid) {
  const updatedJob = {
    ...job,
    bids: job.bids.map(b =>
      b.bidder === bid.bidder ? { ...b, revealed: true } : b
    )
  };
  onSubmitReveal(updatedJob); // update App.jsx state
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




   if (job.status === "BIDDING") {
  return (
    

    <div style={overlayStyle}>
      <div class="jobdetail"style={modalStyle}>
       <div class="cancelbtn"><button onClick={() => navigate(-1)}>✕</button></div> 
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
      <div class="jobdetail"style={modalStyle}>
         <div class="cancelbtn"><button onClick={() => navigate(-1)}>✕</button></div> 
        <h1>{job.title}</h1>
        <p>{job.description}</p>
        <hr />
   
        {job?.bids?.map((b) => (
  <div key={b.bidder} className="bid-row">
    <span>{b.bidder.slice(0, 6)}...{b.bidder.slice(-4)}</span>

    {!b.revealed && (
      <div className="reveal-container">
        {/* Check if current address owns this bid */}
        {address === b.bidder ? (
          <button className="prove1" onClick={() => handleReveal(b)}>
            Reveal My Bid
          </button>
        ) : (
          <span className="text-slate-500 italic">Waiting for bidder...</span>
        )}
      </div>
    )}

    {b.revealed && (
      <div className="revealed-data">
        <strong>Amount:</strong> {b.amount} STRK | 
        <strong> Time:</strong> {b.timeframe} | 
        <strong> Proposal:</strong> {b.proposal}
      </div>
    )}
  </div>
))}
      
        </div>
      </div>
    );
  }

  if (job.status === "COMPLETED") {
    return (
      <div style={overlayStyle}>
      <div class="jobdetail"style={modalStyle}> 
         <div class="cancelbtn"><button onClick={() => navigate(-1)}>✕</button></div> 
        <h1>{job.title}</h1>
         <p>{job.description}</p>
         <hr />
        <p>Bidding COMPLETED</p>
      </div>
      </div>
    );
  }

  return null;



}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: 
 " rgba(11, 21, 33, 0.6)",
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


