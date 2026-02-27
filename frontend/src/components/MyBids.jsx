import { Link } from "react-router-dom";
import "./MyBids.css";

function MyBids({ jobs, address }) {
  // 1. Filter jobs: Show only if the current user has a bid in that job
  const myBids = jobs.filter(job => 
    job && job.bids?.some(bid => bid.bidder.toLowerCase() === address?.toLowerCase())
  );

  return (
    <div className="my-bids-page">
      <h2 className="projh">My Active Bids</h2>

      {myBids.length === 0 ? (
        <p className="projp">You haven't placed any bids yet.</p>
      ) : (
        myBids.map(job => {
          // Find the specific bid placed by the current user for this job
          const userBid = job.bids.find(b => b.bidder.toLowerCase() === address?.toLowerCase());

          return (
            <div key={job.id} className="bidcontainer">
              <div className="displayTitle">
                <h2 className="projh">{job.title}</h2>
                <div className="bid-status-tags">
                  <span className={`state ${job.status.toLowerCase()}`}>
                    Phase: {job.status}
                  </span>
                  {userBid?.revealed && <span className="commits">Revealed</span>}
                  {!userBid?.revealed && <span className="commits">Committed</span>}
                </div>
              </div>

              <div className="provebtn">
                {/* 2. Show Reveal button only during REVEAL phase and if not already revealed */}
                {job.status === "REVEAL" && !userBid?.revealed && (
                   <Link to={`/jobs/${job.id}`}>
                      <button className="prove">Reveal & Prove</button>
                   </Link>
                )}

                <Link to={`/jobs/${job.id}`}>
                  <button className="det">View Job Details</button>
                </Link>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default MyBids;