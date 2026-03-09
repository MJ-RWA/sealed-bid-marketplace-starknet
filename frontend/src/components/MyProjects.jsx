import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./MyProjects.css";

function MyProjects({ jobs = [], address }) {
  const location = useLocation();
  const normalize = (addr) => addr ? BigInt(addr).toString(16).toLowerCase() : "";
  const userAddr = normalize(address);

  const myJobs = jobs.filter(job => normalize(job.employer_address) === userAddr);

  return (
    <div className="my-projects-container">
      <h1 className="projh">My Posted Projects</h1>
      <div className="projects-grid">
        {myJobs.length === 0 ? <p>You haven't posted any jobs yet.</p> : 
          myJobs.map(job => (
            <Link key={job.id} to={`/jobs/${job.id}`} state={{ background: location }} className="project-card-link">
              <div className="project-card">
                <span className="status-badge">{job.status}</span>
                <h3>{job.title}</h3>
                <p>{job.description?.substring(0, 100)}...</p>
              </div>
            </Link>
          ))
        }
      </div>
    </div>
  );
}

export default MyProjects;