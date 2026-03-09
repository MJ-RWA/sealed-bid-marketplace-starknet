import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./MyBids.css";

function MyBids({ jobs = [], address }) {
    const location = useLocation();

    // Helper to normalize addresses for comparison
    const normalize = (addr) => addr ? BigInt(addr).toString(16).toLowerCase() : "";

    const userAddr = normalize(address);

    // Filter jobs where the current user has a bid
    const myBids = jobs.filter(job => 
        job?.bids?.some(bid => normalize(bid.bidder_address) === userAddr)
    );

    return (
        <div className="my-bids-container">
            <h1 className="projh">My Submitted Bids</h1>
            {myBids.length === 0 ? (
                <div className="empty-state">
                    <p>No bids found for address: {address?.slice(0,10)}...</p>
                    <Link to="/ExploreMarket" className="explore-link">Browse Marketplace</Link>
                </div>
            ) : (
                <div className="bids-grid">
                    {myBids.map(job => (
                        <Link key={job.id} to={`/jobs/${job.id}`} state={{ background: location }} className="bid-card-link">
                            <div className="bid-card">
                                <span className="status-badge">{job.status}</span>
                                <h3>{job.title}</h3>
                                <p>On-chain ID: {job.onchain_id || "Syncing..."}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyBids;