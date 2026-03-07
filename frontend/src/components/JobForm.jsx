import { useNavigate } from "react-router-dom";
import { useState } from "react";
import React from "react";
import Modal from "../components/Modal";
import LogicSlider from "./LogicSlider";
import { Contract } from "starknet";
import ABI from "../abi.json";
import "./JobForm.css";

const CONTRACT_ADDRESS = "0x07d4764a30d3eb83c00730c059b71b796692f292e94fc6eb2c20dea4da2b10ae";
const API_URL = "https://fairlance.onrender.com/api/jobs/";

function JobForm({ setJobs, address, jobs }) {
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
    if (!window.starknet?.isConnected) return alert("Please connect wallet");

    setLoading(true);
    try {
      const price_weight = selectionWeight;
      const timeline_weight = 100 - selectionWeight;

      // 1. Starknet FIRST
      const account = window.starknet.account; 
      const contract = new Contract(ABI, CONTRACT_ADDRESS, account);
      const { transaction_hash } = await contract.create_job(price_weight, timeline_weight);

      // 2. Save to Backend only if signed
      const backendData = {
        title,
        description,
        employer_address: window.starknet.selectedAddress,
        price_weight,
        timeline_weight,
        status: "BIDDING"
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendData),
      });

      const savedJob = await res.json();

      // 3. Force state to remain an array
      if (setJobs) {
        const newEntry = { ...savedJob, title, description, onchain_id: null };
        setJobs(prev => Array.isArray(prev) ? [...prev, newEntry] : [newEntry]);
      }

      alert("Success! Hash: " + transaction_hash);
      navigate("/ExploreMarket");
    } catch (error) {
      alert("Error: " + error.message);
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
              <input className="jobinput" placeholder="Job title" value={title} onChange={(e) => setTitle(e.target.value)} required />

              <br />
              <label className="label2">DETAILED DESCRIPTION</label>
              <div className="text">
                <textarea className="textplace" placeholder="What needs to be built? Be specific..." value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>

              <br />
              <div className="share">
                <div className="input-group">
                  <label className="label2">BUDGET RANGE</label>
                  <input type="text" className="budget-input" placeholder="e.g. 1000-2000 STRK" value={budget} onChange={(e) => setBudget(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="label2">BIDDING WINDOW</label>
                  <div className="window-controls">
                    <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="window-num" />
                    <select value={unit} onChange={(e) => setUnit(e.target.value)} className="select1">
                      <option value="minutes">Minutes</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
              </div>
              <br />
              <LogicSlider value={selectionWeight} onChange={setSelectionWeight} />
              <div className="btns">
                <button type="button" className="btn" onClick={() => navigate(-1)}>Cancel</button> 
                <button className="btn2" type="submit" disabled={loading}>{loading ? "Authorizing..." : "Create Job"}</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(11, 21, 33, 0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "15px" };
const modalStyle = { background: "var(--Navbar-bg)", padding: "30px", borderRadius: "12px", width: "100%", maxWidth: "500px", position: "relative" };

export default JobForm;