import { useNavigate } from "react-router-dom";
import { useState } from "react";
import React from "react";
import Modal from "./Modal";
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

      // 1. CALL BLOCKCHAIN FIRST
      const account = window.starknet.account; 
      const contract = new Contract(ABI_FILE.abi || ABI_FILE, CONTRACT_ADDRESS, account);
      const { transaction_hash } = await contract.create_job(price_weight, timeline_weight);

      // 2. SAVE TO BACKEND IMMEDIATELY (Manual Sync)
      // Since we ditched the indexer, we need to ask the user to wait or we manual-sync
      // For the demo, we save it with the status "BIDDING"
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          employer_address: window.starknet.selectedAddress,
          price_weight,
          timeline_weight,
          status: "BIDDING",
          onchain_id: Math.floor(Math.random() * 1000) // Temporary ID for demo
        }),
      });

      alert("Job Created! Blockchain transaction sent.");
      if (onCreated) onCreated();
      navigate("/ExploreMarket");
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal>
      <div className="job">
        <h1 className="projh">Create Job Offer</h1>
        <form onSubmit={handleSubmit}>
          <label className="label2">PROJECT TITLE</label>
          <input className="jobinput" placeholder="Job title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <label className="label2">DETAILED DESCRIPTION</label>
          <textarea className="textplace" placeholder="What needs to be built? Be specific..." value={description} onChange={(e) => setDescription(e.target.value)} required />
          <div className="share">
            <div className="input-group">
                <label className="label2">BUDGET RANGE</label>
                <input type="text" className="budget-input" placeholder="e.g. 1000-2000 STRK" value={budget} onChange={(e) => setBudget(e.target.value)} required />
            </div>
            <div className="input-group">
                <label className="label2">BIDDING WINDOW</label>
                <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="window-num" />
            </div>
          </div>
          <br />
          <LogicSlider value={selectionWeight} onChange={setSelectionWeight} />
          <div className="btns">
            <button type="button" className="btn" onClick={() => navigate(-1)}>Cancel</button> 
            <button className="btn2" type="submit" disabled={loading}>{loading ? "Signing..." : "Create Job"}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default JobForm;