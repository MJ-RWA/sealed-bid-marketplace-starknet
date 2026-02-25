import { useState } from "react";
import "./LogicSlider.css";

function LogicSlider({ value, onChange}) {

  return (
    <div className="slider-container">
      <label>Selection Criteria ({value})</label>

      <input
        type="range"
        min="1"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
      />

      <div className="slider-labels">
        <span>Lower Price</span>
        <span>Faster delivery time</span>
      </div>
    </div>
  );
}

export default LogicSlider;
