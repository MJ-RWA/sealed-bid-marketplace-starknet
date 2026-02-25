import { useState } from "react";
import "./RoleSwitcher.css";

function RoleSwitcher({ role, setRole}) {
  

  return (
    <div className={`role-switcher ${role === "freelancer" ? "freelancer-active" : ""}`}>
      <div className="slider"></div>

      <button
        className={role === "employer" ? "active" : ""}
        onClick={() => setRole("employer")}
      >
        Employer
      </button>

      <button
        className={role === "freelancer" ? "active" : ""}
        onClick={() => setRole("freelancer")}
      >
        Freelancer
      </button>
    </div>
  );
}

export default RoleSwitcher;
