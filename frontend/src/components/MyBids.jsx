import { Link, useParams } from "react-router-dom";
import "./MyBids.css"

function MyBids ({ job }) {
 

  return (
    <>
    <div>
     <h2>My Active Bids</h2>
       <div class="bidcontainer">
       
       <div class="displayTitle">
        <h2>Job title</h2>
        <span class="commits">Comitted</span>
      
      </div>
        <div class="provebtn">
           
            <button class="prove">Reveal & Prove</button>
            <Link to="jobDetail">
            <button class="det">Job Details</button>
            </Link>
        </div>
       </div>
    </div>
    
    </>
  )


}

export default MyBids;