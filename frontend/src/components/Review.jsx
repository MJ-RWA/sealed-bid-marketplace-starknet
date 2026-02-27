import { Link, useNavigate, useLocation } from "react-router-dom";
import Modal from "./Modal";
import "./Review.css"
import { useParams } from "react-router-dom";


function Review ({ jobs }) {
   const navigate = useNavigate();
   const { jobId } = useParams();

   const job = jobs.find(j => j.id === Number(jobId));
    return (
        <>
        <Modal>
        <div style={overlayStyle}>
        <div style={modalStyle}>
         
          <div class="cancel">
          <button
        class="cancelbtn"
        onClick={() => navigate(-1)}
      > ✕</button>
      </div>

       <div class="detail">


         <h2 className="projh">{job?.title}</h2>
         <p className="projp">{job?.description}</p>
      </div> 



         <div class="finalistdetail">
            <span class="text">Top Finalists</span>
            <span class="contract">Ranked By Contract Logic</span>  
        </div>

        
             <hr />

        
         <div>
            
            
             
          {job?.shortlist?.length > 0 ? (
  job.shortlist.map((bid, index) => (
    <div className="listcontainer" key={bid.bidder}>
         <p>Rank #{index + 1}</p>
      <p className="walletaddy">{bid.bidder}</p>
          
      <div className="userdetails">
        <span className="STRK">{bid.amount}</span>
        <span className="timeline">
         Timeframe: {bid.timeframe ? ` ${bid.timeframe} Week` : "N/A"}
        </span>

        <Link to={`/hire/${job.id}/${bid.bidder}`}>
          <button className="hirebut">Hire</button>
        </Link>
      </div>

      <div className="hiredetails">
        <p className="hiredetails1">PROPOSED SOLUTION:</p>
        <p className="hiredetails2">{bid.proposal}</p>
      </div>

    </div>
  ))
) : (
  <p>No shortlisted bidders yet.</p>
)}



            </div>


         </div>
        
        </div>
        
      
        </Modal>
        
        </>
    )
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: 
 "rgba(11, 21, 33, 0.6)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "var(--Navbar-bg)",
  padding: "20px",
  borderRadius: "10px",
  width: "100%",
  maxWidth: "500px",
  border:"1px solid var(--border-main)"
};





export default Review;