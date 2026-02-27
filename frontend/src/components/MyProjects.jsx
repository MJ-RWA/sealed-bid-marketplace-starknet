

//   //  Call backend to generate shortlist
//   async function handleShortlist(jobId) {
//     try {
//       const res = await fetch(
//         `http://localhost:5000/jobs/${jobId}/shortlist`,
//         { method: "POST" }
//       );

//       if (!res.ok) throw new Error("Shortlist failed");

//       const updatedJob = await res.json();

//       // Update global jobs state
//       const newJobs = jobs.map(j =>
//         j.id === updatedJob.id ? updatedJob : j
//       );

//       setJobs(newJobs);

//     } catch (err) {
//       console.error(err);
//     }
//   }

//   return (
//     <>
//       <h2>Jobs I've Posted</h2>

//       {myJobs.length === 0 && <p>No jobs posted yet.</p>}

//       {myJobs.map(job => (
//         <div key={job.id} className="container">

//           <div className="swaphead">
//             <h2>{job.title}</h2>

//             <p className="swap">
//               {job.winner
//                 ? "Winner Selected"
//                 : job.shortlist?.length > 0
//                 ? "Shortlisted"
//                 : job.phase}
//             </p>
//           </div>

//           <div className="buts">

//             {/*  Show shortlist button only during REVEAL and not yet shortlisted */}
//             {job.phase === "REVEAL" &&
//               (!job.shortlist || job.shortlist.length === 0) && (
//                 <button
//                   className="buts2"
//                   onClick={() => handleShortlist(job.id)}
//                 >
//                   Shortlist Finalists
//                 </button>
//             )}

//             {/*  If shortlist exists → allow review */}
//             {job.shortlist?.length > 0 && (
//               <Link to="review" state={{ jobId: job.id }}>
//                 <button className="buts1">Review</button>
//               </Link>
//             )}

//           </div>

//         </div>
//       ))}
//     </>
//   );
// }

// export default MyProjects;

import { Link } from "react-router-dom";
import "./MyProjects.css";

function MyProjects({ jobs, setJobs, address }) {


  //  Only show jobs created by this employer
 
  const myJobs = jobs.filter(
  job => job && job.employerAddress && job.employerAddress.toLowerCase() === address?.toLowerCase()
);




// const handleShortlist = async (jobId) => {
//   try {
//     const res = await fetch(
//       `http://localhost:5000/jobs/${jobId}/shortlist`,
//       { method: "POST" }
//     );

//     const shortlist = await res.json();

//     const updatedJobs = jobs.map(job =>
//       job.id === jobId
//         ? { ...job, shortlist }
//         : job
//     );

//     setJobs(updatedJobs);

//   } catch (err) {
//     console.error(err);
//   }
// };






  
  // Mock shortlist logic (temporary until backend)
    const handleShortlist = (jobId) => {
  setJobs(prev =>
    prev.map(job => {
      if (job.id !== jobId) return job;

      // Filter only revealed bids
      const revealed = job.bids || [];
      if (revealed.length === 0) {
        console.log("No revealed bids yet for job", job.title);
        return job;
      }
      

      const weight = Number(job.selectionWeight || 50);

      // Sort by weighted score
      const sorted = [...revealed].sort((a, b) => {
        const scoreA = weight * Number(a.amount) + (100 - weight) * Number(a.duration);
        const scoreB = weight * Number(b.amount) + (100 - weight) * Number(b.duration);
        return scoreA - scoreB;
      });

      // Return updated job object with shortlist
      return {
        ...job,
        shortlist: sorted.slice(0, 3) // top 3
      };
    })
  );
};
  return (
    <>
      <h2 className="posted">Jobs I've Posted</h2>

      {myJobs.length === 0 && (
        <p>You haven't posted any jobs yet.</p>
      )}

      {myJobs.map(job => (
        <div key={job.id} className="container">

          <div className="swaphead">
            <h1 className="projh">{job.title}</h1>
            <p className="projp">{job.description}</p>

            <p className="swap">
              {job.winner
                ? "Winner Selected"
                : job.shortlist?.length > 0
                ? "Shortlist"
                : job.status}
            </p>
          </div>

          <div className="buts">

            {/*  Shortlist button control */}
            {job.status === "REVEAL" &&
             (!job.shortlist || job.shortlist.length === 0) && (
              <button
                className="buts2"
                onClick={handleShortlist.bind(null, job.id)}
              >
                Shortlist Finalists
              </button>
            )}

            {/* Show review if shortlisted */}
            {job.shortlist?.length > 0 && (
              <Link to={`/review/${job.id}`}>
                <button className="buts1">Review</button>
              </Link>
            )}

          </div>

          {/* Show shortlist preview
          {job.shortlisted?.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <strong>Shortlisted:</strong>
              {job.shortlisted.map(bid => (
                <p key={bid.bidder}>
                  {bid.bidder} 
                  {bid.amount}
                </p>
              ))}
            </div>
          )} */}

        </div>
      ))}
    </>
  );
}

export default MyProjects;