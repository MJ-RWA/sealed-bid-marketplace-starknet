import Modal from "./Modal";
import { useNavigate } from "react-router-dom";

function BidJobDetail () {
  const navigate = useNavigate();
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

    <h2>Job Title</h2>
    <p>Job description</p>
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
export default BidJobDetail;