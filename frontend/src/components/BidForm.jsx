import { useState } from "react";
import { useNavigate, useLocation, Link, Outlet } from "react-router-dom";
import React from "react";
import ProposalForm from "./ProposalForm";
import "./BidForm.css";


function BidForm({ job, jobs, address, onSubmitBid }) {
const navigate = useNavigate();
const [bidAmount, setBidAmount] = useState("");
 const [timeframe, setTimeframe] = useState("");
 const [commitSuccess, setCommitSuccess] = useState(false);
 const [proposal, setProposal] = useState("");
  


  function handleCommit(e) {
    e.preventDefault();

    if (!bidAmount) return;

    // Prevent double commit
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

    // const updatedJobs = jobs.map(j =>
    //   j.id === job.id
    //     ? { ...j, bids: [...j.bids, newBid] }
    //     : j
    // );

   onSubmitBid(newBid);
   
    setProposal("");
    setBidAmount("");
    setTimeframe("");
    navigate("commit-message")
    setCommitSuccess(true);
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
           
          
        </div>
        <br />
      <form onSubmit={handleCommit}>
        <div class="forms">
        <div>
          <label class="label1">PRICE (STRK)</label>
          <input type="text" placeholder="Enter your bid amount" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} required />
        </div>


        <div>
         <label class="label1">TIMEFRAME (Week/Days)</label>
        <input type="text"  required value={timeframe}
        onChange={(e) => setTimeframe(e.target.value)}/>
        
        </div>
       </div>
       <br />
       
        <ProposalForm 
        value={proposal}
        onChange={setProposal}/>

        <br />
        <div class="submit">
        <Link to="commit-message"></Link>
        <button class="submit1"type="submit">Seal & commit to starknet</button>
        
        </div>
          <span class="span1">Warning: Your bid cannot be changed once commited. The Hash ensures fairness</span>
          {commitSuccess && <p>Bid successfully committed!</p>}
      </form>

      
    </div>
  );
}

export default BidForm;
