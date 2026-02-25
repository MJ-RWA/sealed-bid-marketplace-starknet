import { useNavigate, useLocation } from "react-router-dom";

function Modal({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const background = location.state?.background;

  function closeModal() {
    if (background) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }

  return (
    <div style={overlayStyle} onClick={closeModal}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={closeModal}
          style={closeBtnStyle}
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "#fff",
  padding: "30px",
  borderRadius: "12px",
  width: "100%",
  maxWidth: "500px",
  position: "relative",
};

const closeBtnStyle = {
  position: "absolute",
  top: "10px",
  right: "10px",
  background: "transparent",
  border: "none",
  fontSize: "18px",
  cursor: "pointer",
};

export default Modal;
