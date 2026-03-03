// import Modal from "./Modal";
// import { useNavigate,useLocation } from "react-router-dom";
// import "./Hire.css"
// import { useParams } from "react-router-dom";

// function Hire ({ jobs, setJobs, address }) {
//  const navigate = useNavigate();
// const location = useLocation();
// const background = location.state?.background;
// const { jobId } = useParams();


// const job = jobs.find(j => j.id === Number(jobId))

//  function closeModal() {
//   if (background) {
//     navigate(-1);
//   } else {
//     navigate("/");
//   }
// }
//  return (

//     <div style={overlayStyle}>
//    <div style={modalStyle}>

//      <div class="cancel">
//           <button
//         class="cancelbtn"
//          onClick={closeModal}
//       > ✕</button>
//       </div>
//         <h1>{job?.title}</h1>
//         <p class="description">{job?.description}</p>
//   <hr />

  
//         <div>
//             <div className="awarddetail">

//                 <div><p class="jobto">JOB AWARDED TO</p></div>
//                 <div className="awarddetail1">
//                 <span class="try">{job?.address}</span>
//                 <span class="price">200 STRK</span>
//                 </div>
//                 <div class="bidderproposal">Bidder Proposal</div>
//             </div>
//         </div>
//    </div>
//  </div>
//  )
// }


// const overlayStyle = {
//   position: "fixed",
//   inset: 0,
//   background: "rgba(0,0,0,0.6)",
//   backdropFilter: "blur(6px)",
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
//   zIndex: 1000,
// };

// const modalStyle = {
//   background: "var(--Navbar-bg)",
//   padding: "30px",
//   borderRadius: "8px",
//   width: "100%",
//   maxWidth: "450px",
// };






// export default Hire;

import "./Hire.css"
import { useParams, useNavigate, useLocation } from "react-router-dom";

function Hire({ jobs, setJobs }) {
  

  const { jobId, bidder } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
const background = location.state?.background;

  const job = jobs.find(j => j.id === Number(jobId));

  if (!job) return <p>Job not found</p>;

  // Inside Hire.js
const handleConfirmHire = () => {
  if (job.winner) {
    alert("Job Already Awarded!");
    return;
  }

  setJobs(prev =>
    prev.map(j => {
      if (j.id === Number(jobId)) {
        return {
          ...j,
          winner: bidder.toLowerCase(), 
          status: "COMPLETED"
        };
      }
      return j;
    })
  );

  alert("Job successfully Awarded!");
  navigate("/myprojects");
};

  function closeModal() {
  if (background) {
    navigate(-1);
  } else {
    navigate("/");
  }
}

  return (
    <div style={overlayStyle}>
    <div style={modalStyle}>

       <div class="cancel">
      <button
        class="cancelbtn"
         onClick={closeModal}
      > ✕</button>
      </div>
     <div className="HireContainer"> 
      <h1 className="projh">Confirm Hire</h1>
      <div className="intensive">
      <p className="HireT">JOB: {job.title}</p>
      <p className="HireE">Selected bidder: <span className="monos">{bidder}</span></p>
     </div>
      <button  className="conHire"onClick={handleConfirmHire}>
        Confirm Hire
      </button>
    </div>

    </div>
    </div>
  );
}


const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "var(--Navbar-bg)",
  padding: "30px",
  borderRadius: "8px",
  width: "100%",
  maxWidth: "450px",
};

export default Hire;