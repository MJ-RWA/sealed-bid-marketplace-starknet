import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./MyBids.css";

function MyBids({ jobs = [], address }) {
    const location = useLocation();

    // Filter jobs where the current user has submitted a bid
    const myBids = jobs.filter(job => 
        job?.bids?.some(bid => 
            bid.bidder_address?.toLowerCase() === address?.toLowerCase()
        )
    );

    return (
        <div className="my-bids-container">
            <h1 className="projh">My Submitted Bids</h1>
            <p className="subtitle">Track your proposals and unseal them during the reveal phase.</p>

            {myBids.length === 0 ? (
                <div className="empty-state">
                    <p>You haven't bidded on any projects yet.</p>
                    <Link to="/ExploreMarket" className="explore-link">Browse Marketplace</Link>
                </div>
            ) : (
                <div className="bids-grid">
                    {myBids.map(job => {
                        // Find the specific bid for this user
                        const myBid = job.bids.find(b => b.bidder_address?.toLowerCase() === address?.toLowerCase());
                        
                        return (
                            <Link 
                                key={job.id} 
                                to={`/jobs/${job.id}`} 
                                state={{ background: location }}
                                className="bid-card-link"
                            >
                                <div className="bid-card">
                                    <div className="bid-card-header">
                                        <span className={`status-badge ${job.status.toLowerCase()}`}>
                                            {job.status}
                                        </span>
                                        <span className="job-id">Job #{job.onchain_id || "..."}</span>
                                    </div>
                                    <h3>{job.title}</h3>
                                    <div className="bid-summary">
                                        <p><strong>Your Proposal:</strong> {myBid?.proposal?.substring(0, 50)}...</p>
                                        <p><strong>Status:</strong> {myBid?.revealed ? "✅ Revealed" : "🔒 Sealed"}</p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default MyBids;