import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import React from "react";
import Modal from "../components/Modal";
import LogicSlider from "./LogicSlider";
import "./JobForm.css"
import { createJob } from "../services/jobServices";


function JobForm({ setJobs, address}) {
const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState(5);
  const [unit, setUnit] = useState("days");
  const [loading, setLoading] = useState(false);
  const [selectionWeight, setSelectionWeight] = useState(50);
  const [proposal, setProposal] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();

    // if (!address) {
    //   alert("Connect wallet first");
    //   return;
    // }
    setLoading(true);
   
    try {
     const timeMultipliers ={
      minutes: 60 * 1000,
      days: 24  * 60 * 60 * 1000,
     };

     const deadline =
        Date.now() + Number(duration) * timeMultipliers[unit];

      const newJob = await createJob({
        title,
        description,
        budget,
        duration,
        unit,
        employerAddress: address,
        deadline,
        status: "BIDDING",
        bids: [],
        revealedBids: [],
        shortlisted:[],
        winner: null,
        selectionWeight,
      });

      setJobs((prev) => [...prev, newJob]);
      alert("Job created successfully!");
      setTitle("");
      setDescription("");
      setBudget("");
      navigate(-1);
    } catch (error) {
     
     console.error("ACTUAL ERROR:", error);
    alert(error.message);

    }
    setLoading(false);
  };

   



  return (
    <Modal>
      <div style={overlayStyle}>
      <div style={modalStyle}>

    <div class="cancelbtn"><button onClick={() => navigate(-1)}>✕</button></div> 

    <form onSubmit={handleSubmit}>
       
         

      <div class="job">
      <h1>Create Job Offer</h1>

      <br />
      <label class="label2">PROJECT TITLE</label>
      <div>
      <input class="jobinput" 
      placeholder="Job title" 
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      required />
      </div>

      <br />

       <label class="label2">DETAILED DESCRIPTION</label>
      <div class="text">
      <textarea className="textplace" placeholder="What needs to be built? Be specific..." 
       value={description}
       onChange={(e) => setDescription(e.target.value)}
      required />
       </div>

      <br />

      <div class="share">

         
      <div>
        <label class="label2">BUDGET RANGE</label>
      <input 
      type="text" 
      placeholder="e.g. 1000-2000 STRK"
      value={budget}
      onChange={(e) => setBudget(e.target.value)}
     required />
      </div>

       
                  <div class="widow1">
                 <div> <label class="label2">Bidding Window</label></div>
                    <input
                     name="duration" 
                     type="number" 
                     value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                
                      className="window" />
                  
                    <select 
                    name="unit" 
                    onChange={(e) => setUnit(e.target.value)}
                    value={unit}
                    class="select1">

                      <option value="minutes">Minutes</option>
                      <option value="days">Days</option>
                     </select>
              </div>


       </div>
          <br />

       <LogicSlider 
       value={selectionWeight}
       onChange={setSelectionWeight} />

       <div class="notice">
         N/B:

Before publishing a job, 

use the slider to decide what matters more to you — lower price or faster delivery time.

The system will automatically rank and shortlist bids based on the priority you set.


       </div>
      <div class="btns">
       <button class="btn"onClick={() => navigate(-1)}>Cancel</button> 
      <button className="btn2" type="submit">{loading ? "Creating..." : "Create Job"}</button>
      </div>
      </div>
    </form>
    </div>
    </div>
    </Modal>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(11, 21, 33, 0.6)",
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
  maxWidth: "500px",
};


export default JobForm;
