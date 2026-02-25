import React from "react";
import JobForm from "../components/JobForm";
import { Link, useLocation } from "react-router-dom";

function JobBoard() {
   const location = useLocation();

  return (
    <div>
      <h2>Job Board</h2>
      <JobForm />
       <Link
            to="/jobs/1"
            state={{ background: location }}
          >
          </Link>


    </div>
  );
}

export default JobBoard;
