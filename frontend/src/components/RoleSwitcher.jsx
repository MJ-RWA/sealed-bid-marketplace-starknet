import { useNavigate } from "react-router-dom";
import "./RoleSwitcher.css";


function RoleSwitcher({ role, setRole }) {
  const navigate = useNavigate();

  const handleToggle = (newRole) => {
    setRole(newRole);
    
    // Automatic redirection logic
    if (newRole === "employer") {
      navigate("/Myprojects");
    } else {
      navigate("/MyBids");
    }
  };

  return (
    <div className={`role-switcher ${role === "freelancer" ? "freelancer-active" : ""}`}>
      <div className="slider"></div>

      <button
        className={role === "employer" ? "active" : ""}
        onClick={() => handleToggle("employer")}
      >
        Employer
      </button>

      <button
        className={role === "freelancer" ? "active" : ""}
        onClick={() => handleToggle("freelancer")}
      >
        Freelancer
      </button>
    </div>
  );
}

export default RoleSwitcher;