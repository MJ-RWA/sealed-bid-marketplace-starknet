import { useNavigate } from "react-router-dom";
import { useState } from "react";
import React from "react";
import Modal from "../components/Modal";
import LogicSlider from "./LogicSlider";
import { Contract, RpcProvider } from "starknet";
import ABI_FILE from "../abi.json";
import "./JobForm.css";

const CONTRACT_ADDRESS = "0x07d4764a30d3eb83c00730c059b71b796692f292e94fc6eb2c20dea4da2b10ae";
const API_URL = "https://fairlance.onrender.com/api/jobs/";
const PROVIDER_URL = "https://starknet-sepolia.g.alchemy.com/v2/-Rtawji0LtXGEBL6hW-wR";

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
      const provider = new RpcProvider({ nodeUrl: PROVIDER_URL });

      // 1. CALL BLOCKCHAIN
      const account = window.starknet.account; 
      const contract = new Contract(actualAbi, CONTRACT_ADDRESS, account);
      
      console.log("Triggering Starknet Transaction...");
      const { transaction_hash } = await contract.create_job(price_weight, timeline_weight);
      
      // 2. WAIT FOR RECEIPT TO GET THE REAL ID
      // This ensures we don't save a "700+" ID anymore
      console.log("Waiting for transaction confirmation...");
      const receipt = await provider.waitForTransaction(transaction_hash);
      
      // Extract the job_id from the 'JobCreated' event in the receipt
      // The event data: [job_id, employer_address]
      const realOnchainID = parseInt(receipt.events[0].data[0], 16);
      console.log("Real On-chain ID discovered:", realOnchainID);

      // 3. SAVE TO BACKEND WITH THE REAL ID
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
          onchain_id: realOnchainID // SAVING THE REAL ID
        }),
      });

      alert(`Job Created Successfully! On-chain ID: ${realOnchainID}`);
      if (onCreated) onCreated();
      navigate("/ExploreMarket");

    } catch (error) {
      console.error("Workflow Error:", error);
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
                <button className="btn2" type="submit" disabled={loading}>{loading ? "Wait for Starknet..." : "Create Job"}</button>
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