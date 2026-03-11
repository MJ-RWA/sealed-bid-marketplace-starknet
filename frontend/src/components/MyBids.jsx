import React from "react";
import { Link, useLocation } from "react-router-dom";
import { normalizeAddress } from "../services/blockchainUtils";
import "./MyBids.css";

function MyBids({ jobs = [], address }) {
    const location = useLocation();
    const userAddr = normalizeAddress(address);

    // Filter jobs where the current user's normalized address exists in the bids list
    const myBids = jobs.filter(job => {
        if (!job.bids || !Array.isArray(job.bids)) return false;
        
        return job.bids.some(bid => {
            // Check both possible field names from backend/frontend
            const bAddr = bid.bidder_address || bid.bidder;
            return normalizeAddress(bAddr) === userAddr;
        });
    });

    return (
        <div className="my-bids-container">
            <h1 className="projh">My Submitted Bids</h1>
            <p className="subtitle">Displaying bids for: {address?.slice(0, 12)}...</p>

            {myBids.length === 0 ? (
                <div className="empty-state">
                    <p>No bids found in the database for this wallet.</p>
                    <Link to="/ExploreMarket" className="explore-link">Browse Marketplace</Link>
                </div>
            ) : (
                <div className="bids-grid">
                    {myBids.map(job => (
                        <Link 
                            key={job.id} 
                            to={`/jobs/${job.id}`} 
                            state={{ background: location }} 
                            className="bid-card-link"
                        >
                            <div className="bid-card">
                                <div className="bid-card-header">
                                    <span className="status-badge">{job.status}</span>
                                    <span className="job-id">Job #{job.onchain_id || "Syncing"}</span>
                                </div>
                                <h3>{job.title}</h3>
                                <p className="bid-meta">{job.bids.length} total bids on this project</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyBids;