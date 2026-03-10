import { useNavigate } from "react-router-dom";
import { useState } from "react";
import React from "react";
import Modal from "../components/Modal";
import LogicSlider from "./LogicSlider";
import { Contract } from "starknet";
import ABI_FILE from "../abi.json";
import "./JobForm.css";

const CONTRACT_ADDRESS = "0x07d4764a30d3eb83c00730c059b71b796692f292e94fc6eb2c20dea4da2b10ae";
const API_URL = "https://fairlance.onrender.com/api/jobs/";

function JobForm({ address, onCreated }) {
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
    setLoading(true);
    try {
      const price_weight = selectionWeight;
      const timeline_weight = 100 - selectionWeight;
      const actualAbi = ABI_FILE.abi || ABI_FILE;

      // 1. Blockchain Call
      const account = window.starknet.account; 
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, account);
      const { transaction_hash } = await contract.create_job(price_weight, timeline_weight);

      // 2. Direct Backend Save (No Indexer)
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, 
          employer_address: window.starknet.selectedAddress,
          price_weight, timeline_weight,
          status: "BIDDING",
          onchain_id: Math.floor(Math.random() * 900) + 100 // Dummy ID for demo
        }),
      });

      alert("Job Published Successfully!");
      if (onCreated) onCreated();
      navigate("/ExploreMarket");
    } catch (error) {
      alert("Error: " + error.message);
    } finally { setLoading(false); }
  };

  return (
    <Modal>
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div className="cancelbtn"><button type="button" onClick={() => navigate(-1)}>✕</button></div> 
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
              <div className="notice">
                N/B: Before publishing a job, use the slider to decide what matters more to you — lower price or faster delivery time.
              </div>
              <div className="btns">
                <button type="button" className="btn" onClick={() => navigate(-1)}>Cancel</button> 
                <button className="btn2" type="submit" disabled={loading}>{loading ? "Signing..." : "Create Job"}</button>
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