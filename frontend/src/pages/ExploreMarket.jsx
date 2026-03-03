import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "./ExploreMarket.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser } from "@fortawesome/free-solid-svg-icons";

function ExploreMarket({ jobs =[] }) {
  const location = useLocation();
  const [timers, setTimers] = useState({}); 
  
  const state = {
  BIDDING: "state",
  REVEAL: "state1",
  COMPLETED: "state2",
};
  //  Temporary local state (later this comes from backend)
  // const [jobs, setJobs] = useState([]);

//   useEffect(() => {
//   fetch("http://localhost:5000/jobs")
//     .then((res) => res.json())
//     .then((data) => {
//       console.log("Fetched jobs:", data);
//       setJobs(data);
//     })
//     .catch((err) => console.error("Error:", err));
// }, []);


  // Update timers every second
   useEffect(() => {
  const interval = setInterval(() => {
    const newTimers = {};

    jobs.forEach((job) => {
      if (!job || !job.deadline) return;

      const now = Date.now();
      const deadline = new Date(job.deadline).getTime();

      newTimers[job.id] = Math.max(deadline - now, 0);
    });

    setTimers(newTimers);
  }, 1000);

  return () => clearInterval(interval);
}, [jobs]);

  function formatTime(ms) {
    if (ms <= 0) return "Deadline passed";

    const totalSeconds = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
   return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }








  return (
    <>
    <div id="cardheading">
      <h1>Active Opportunities</h1>
      <p>Browse opportunities. Seal your bid. Let provable fairness decide the shortlist.</p>
  

     {/* <Link to="/jobs/1" state={{ background: location }} className="job-card-link"> */}

   {jobs.length === 0 && <p>No jobs available yet.</p>}
    
      {jobs
      .filter(job => job && job.id)
      .map((job) => (
        <Link
          key={job.id}
          to={`/jobs/${job.id}`}
          state={{ background: location }}
          className="job-card-link"
        >

    <div className="job-card" style={{ padding:"20px"}}>
        <div class="jobcarddetail">
            <span  className={state[job.status]}>{job.status}</span>
            <span class="amount">
              
              {job.budget || "Budget not set"}
            </span>
        </div>
        
        <div>
            <h2>{job.title}</h2>
            <p>{job.description || "No description provided"}</p>
        </div>
        
         <hr />
         
         <div className ="jobcarddetail2">
          <div className="employer">
           <span><FontAwesomeIcon icon={faCircleUser} size="lg" style={{color: "var(--Emyr-bg-txt)"}} />Employer: {job.employerAddress?.slice(0, 6)}...</span>
           </div>
            <div className="deadline">
            <span className="deadline-time">Deadline</span>
            <span className={`deadline-time ${timers[job.id] <= 0 ? 'expired' : ''}`}>
            {timers[job.id] !== undefined 
            ? formatTime(timers[job.id]) 
          : "N/A"}
           </span>
            </div>
         </div>
    </div>
   </Link>

      ))}
</div>
      
    </>
  );
}

export default ExploreMarket;