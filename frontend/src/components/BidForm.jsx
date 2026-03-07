import { useState } from "react";
import { Navigate, useNavigate, useLocation, Link, Outlet } from "react-router-dom";
import React from "react";
import ProposalForm from "./ProposalForm";
import "./BidForm.css";


function BidForm({ job, jobs, address, onSubmitBid }) {
const navigate = useNavigate();
const [bidAmount, setBidAmount] = useState("");
 const [timeframe, setTimeframe] = useState("");
 const [commitSuccess, setCommitSuccess] = useState(false);
 const [proposal, setProposal] = useState("");
 const isOwner = address?.toLowerCase() === job?.employerAddress?.toLowerCase();
 const hasBid = job.bids.some(b => b.bidder === address);
 const bidCount = job.bids?.length || 0;

 


 function handleCommit(e) {
    e.preventDefault();

    if (!bidAmount) return;

    // 1. New Check: Prevent employer from bidding on their own job
    if (address?.toLowerCase() === job.employerAddress?.toLowerCase()) {
      alert("Action denied: You cannot bid on a job you created.");
      return;
    }

    
    if (job.bids.some(b => b.bidder === address)) {
      alert("You already committed a bid.");
      return;
    }

    const newBid = {
      bidder: address,
      amount: (bidAmount),
      committedAt: Date.now(),
      timeframe:(timeframe),
      proposal:proposal,
      revealed: false
    };

    onSubmitBid(newBid);
    
    setProposal("");
    setBidAmount("");
    setTimeframe("");
    navigate("commit-message");
    setCommitSuccess(true);
  }



  //  backend call 
// async function handleCommit(e) { 
//   e.preventDefault();

//   if (!bidAmount || loading) return; 


//   if (address?.toLowerCase() === job.employerAddress?.toLowerCase()) {
//     alert("You cannot bid on your own job.");
//     return;
//   }

//   setLoading(true); 

//   try {
   
//     const response = await fetch(`${process.env.REACT_APP_API_URL}/jobs/${job.id}/bids`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         bidder: address,
//         amount: bidAmount,
//         timeframe: timeframe,
//         proposal: proposal,
//         committedAt: Date.now(),
//         revealed: false
//       }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || "Failed to submit bid");
//     }

//     const savedBid = await response.json();

    
//     onSubmitBid(savedBid); 
    
//     setProposal("");
//     setBidAmount("");
//     setTimeframe("");
//     navigate("commit-message");
//     setCommitSuccess(true);

//   } catch (error) {
//     console.error("Submission Error:", error);
//     alert(error.message);
//   } finally {
//     setLoading(false); 
//   }
// }

// Replace your current if (hasBid) block with this:
if (hasBid) {
  return (
    <div className="success-container">
       <h3>Bid Already Submitted</h3>
        <p>Please wait for the reveal phase.</p>
       {/* Use a Link here instead of Navigate to avoid the loop */}
       <Link to={`/jobs/${job.id}/commit-message`} className="view-link">
         View on StarkScan
       </Link>
    </div>
  );
}

  if (isOwner) {
    return (
      <div className="owner-view">
        <div className="modal-header">
          
  
        </div>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>You created this job. You can view bids once the reveal phase begins.</p>
        </div>
         <div className="manage">
          <h2>Manage Your Job</h2>
         </div>
      </div>
    );
  }
   
  
  
  return (
    <div>
     
      {/* Header */}
        <div className="modal-header">
          <div>
            {/* <h2>{selectedJob.title}</h2> */}
            <div className="status-row">
              <span className="status commit">PHASE 1: COMMIT</span>
              <span className="status reveal">PHASE 2: REVEAL</span>
            </div>
          </div>
           
          <div className="bid-counter">
      <span className="pulse-dot"></span> 
      <strong>{bidCount}</strong> {bidCount === 1 ? 'Bid' : 'Bids'} Committed
       </div>


        </div>
        <br />
      <form onSubmit={handleCommit}>
        <div className="forms"> 
    <div className="input-wrap"> 
      <label className="label1">PRICE (STRK)</label>
      <input 
        type="number" 
        className="bid-input" 
        placeholder="Enter your bid amount" 
        value={bidAmount} 
        onChange={(e) => setBidAmount(e.target.value)} 
        required 
      />
    </div>

    <div className="input-wrap">
      <label className="label1">TIMEFRAME (Weeks)</label>
      <input 
        type="number" 
        className="bid-input" 
        required 
        value={timeframe}
        onChange={(e) => setTimeframe(e.target.value)}
      />
    </div>
  </div>
       <br />
       
        <ProposalForm 
        value={proposal}
        onChange={setProposal}/>

        <br />
        <div class="submit">
        <Link to="commit-message"></Link>
        <button class="submit1"type="submit">Seal & commit to contract</button>
        
        </div>
          <span class="span1">Warning: Your bid cannot be changed once commited. The Hash ensures fairness</span>
          {commitSuccess && <p>Bid successfully committed!</p>}
      </form>


      
    </div>
  );
}

export default BidForm;
