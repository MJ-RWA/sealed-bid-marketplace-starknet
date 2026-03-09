import React from "react";
import { Link, useLocation } from "react-router-dom";
import { normalizeAddress } from "../services/blockchainUtils";
import "./MyBids.css";

function MyBids({ jobs = [], address }) {
    const location = useLocation();
    const userAddr = normalizeAddress(address);

    // FIX: Match bidder address using integer-normalized strings
    const myBids = jobs.filter(job => 
        job?.bids?.some(bid => normalizeAddress(bid.bidder_address) === userAddr)
    );

    return (
        <div className="my-bids-container">
            <h1 className="projh">My Submitted Bids</h1>
            {myBids.length === 0 ? (
                <div className="empty-state">
                    <p>No bids found for: {address?.slice(0,10)}...</p>
                    <Link to="/ExploreMarket" className="explore-link">Browse Marketplace</Link>
                </div>
            ) : (
                <div className="bids-grid">
                    {myBids.map(job => (
                        <Link key={job.id} to={`/jobs/${job.id}`} state={{ background: location }} className="bid-card-link">
                            <div className="bid-card">
                                <div className="bid-card-header">
                                    <span className="status-badge">{job.status}</span>
                                    <span className="job-id">Job #{job.onchain_id || "..." }</span>
                                </div>
                                <h3>{job.title}</h3>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyBids;