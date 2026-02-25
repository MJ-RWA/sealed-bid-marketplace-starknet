import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useNavigate, useParams, useLocation  } from "react-router-dom";
import "./CommitMessage.css"

function CommitMessage ({jobs}) {
    const navigate = useNavigate();
  const { id } = useParams();
 const location = useLocation();
const background = location.state?.background;

function closeModal() {
  if (background) {
    navigate(-1);
  } else {
    navigate("/");
  }
}


  const job = jobs?.find(j => j && j.id === Number(id));

  if (!job) {
    return <p>Job not found</p>;
  }


      return (
        <>
          <div style={overlayStyle}  onClick={closeModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div class="cancel">
                 <button class="cancelbtn" onClick={closeModal}>✕</button>
            </div>
            <div class="title">
            <h2>{job.title}</h2>
             <span>{job.description}</span>
            </div>

           <hr />
           <div class="message">
              <FontAwesomeIcon
              icon= {faCircleCheck} 
              style={{color: "#16d022",}}
              size="5x" />
                <h3>Bid commit successful</h3>
                <p>Your bid has been cryptographically committed to StarkNet.</p>
           </div>
           </div>
           </div>
        </>


      )

}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
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
  maxWidth: "450px",
};




export default CommitMessage;