import { useNavigate } from "react-router-dom";
import { useState } from "react";
import React from "react";
import Modal from "../components/Modal";
import LogicSlider from "./LogicSlider";
import { Contract, RpcProvider } from "starknet";
import ABI from "../abi.json"; // Make sure this file exists in src/
import "./JobForm.css";

const CONTRACT_ADDRESS = "0x07d4764a30d3eb83c00730c059b71b796692f292e94fc6eb2c20dea4da2b10ae";
const API_URL = "https://fairlance.onrender.com/api/jobs/";

function JobForm({ setJobs, address }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState(5);
  const [unit, setUnit] = useState("days");
  const [loading, setLoading] = useState(false);
  const [selectionWeight, setSelectionWeight] = useState(50);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!window.starknet || !window.starknet.isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    setLoading(true);
    try {
      const price_weight = selectionWeight;
      const timeline_weight = 100 - selectionWeight;

      // STEP 1: SAVE TO DJANGO BACKEND
      console.log("Saving metadata to Django...");
      const backendResponse = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          employer_address: window.starknet.selectedAddress,
          price_weight,
          timeline_weight,
          status: "BIDDING"
        }),
      });

      if (!backendResponse.ok) throw new Error("Backend save failed");
      const savedJob = await backendResponse.json();

      // STEP 2: TRIGGER STARKNET TRANSACTION
      console.log("Triggering Starknet Transaction...");
      const account = window.starknet.account; 
      const marketplaceContract = new Contract(ABI, CONTRACT_ADDRESS, account);

      const { transaction_hash } = await marketplaceContract.create_job(
        price_weight,
        timeline_weight
      );

      alert("Job Published Successfully!\nTransaction Hash: " + transaction_hash);

      if (setJobs) {
        setJobs((prev) => [...prev, savedJob]);
      }
      navigate(-1);
    } catch (error) {
      console.error("ACTUAL ERROR:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal>
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div className="cancelbtn">
            <button type="button" onClick={() => navigate(-1)}>✕</button>
          </div> 

          <form onSubmit={handleSubmit}>
            <div className="job">
              <h1 className="projh">Create Job Offer</h1>
              <br />
              <label className="label2">PROJECT TITLE</label>
              <div>
                <input 
                  className="jobinput" 
                  placeholder="Job title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required 
                />
              </div>
              <br />
              <label className="label2">DETAILED DESCRIPTION</label>
              <div className="text">
                <textarea 
                  className="textplace" 
                  placeholder="What needs to be built? Be specific..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required 
                />
              </div>
              <br />
              <div className="share">
                <div className="input-group">
                  <label className="label2">BUDGET RANGE</label>
                  <input 
                    type="text" 
                    className="budget-input"
                    placeholder="e.g. 1000-2000 STRK"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    required 
                  />
                </div>
                <div className="input-group">
                  <label className="label2">BIDDING WINDOW</label>
                  <div className="window-controls">
                    <input
                      name="duration" 
                      type="number" 
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="window-num" 
                    />
                    <select 
                      name="unit" 
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="select1"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
              </div>
              <br />
              <LogicSlider value={selectionWeight} onChange={setSelectionWeight} />
              <div className="notice">
                N/B: Before publishing a job, use the slider to decide what matters more to you — lower price or faster delivery time. The system will automatically rank and shortlist bids based on the priority you set.
              </div>
              <div className="btns">
                <button type="button" className="btn" onClick={() => navigate(-1)}>Cancel</button> 
                <button className="btn2" type="submit" disabled={loading}>
                  {loading ? "Authorizing..." : "Create Job"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(11, 21, 33, 0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "15px" };
const modalStyle = { background: "var(--Navbar-bg)", padding: "clamp(15px, 5vw, 30px)", borderRadius: "12px", width: "100%", maxWidth: "500px", maxHeight: "95vh", overflowY: "auto", position: "relative" };

export default JobForm;