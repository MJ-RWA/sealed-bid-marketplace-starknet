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
  alert("Bid revealed! (mock)");
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
       <button onClick={() => changeStatus("REVEAL")}>
      Move to Reveal
    </button>
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
  <div key={b.bidder}>
    <span>{b.bidder.slice(0,6)}...</span>

    {!b.revealed && (
      <div className="reveal-container">
        <button
          className="prove1"
          onClick={() => handleReveal(b)}
        >
          Reveal Bid
        </button>
      </div>
    )}

    {b.revealed && (
      <span>
        Revealed: AMOUNT: {b.amount} TIMEFRAME: {b.timeframe} PROPOSAL: {b.proposal}
      </span>
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
  width: "100%",
  maxWidth: "600px",
};





export default JobDetail;


