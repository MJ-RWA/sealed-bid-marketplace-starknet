import React from "react";
import Modal from "./Modal";
import { useNavigate } from "react-router-dom";

function BidJobDetail ({ job }) {
  const navigate = useNavigate();
  
  return (
    <Modal>
        <div style={overlayStyle}>  
            <div style={modalStyle}>
                <div className="cancel">
                    <button
                        className="cancelbtn"
                        onClick={() => navigate(-1)}
                    > ✕</button>
                </div>

                <h2>{job?.title || "Job Details"}</h2>
                <p style={{color: 'var(--text-secondary)', marginTop: '10px'}}>
                    {job?.description || "No description provided for this project."}
                </p>
                
                <div style={{marginTop: '20px', fontSize: '0.9rem', borderTop: '1px solid var(--divider)', paddingTop: '10px'}}>
                    <p><strong>Employer:</strong> {job?.employer_address}</p>
                    <p><strong>Budget:</strong> {job?.budget || "Negotiable"}</p>
                    <p><strong>Status:</strong> {job?.status}</p>
                </div>
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
  borderRadius: "12px",
  width: "100%",
  maxWidth: "500px",
  border: "1px solid var(--border-main)",
  color: "var(--text-primary)"
};

export default BidJobDetail;