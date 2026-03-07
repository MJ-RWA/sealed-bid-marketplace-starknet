import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import MainLayout from "./Layout/MainLayout";
import { useState, useEffect } from "react";
import "./index.css";
import LoginModal from "./components/LoginModel";
import { connect as starknetConnect, disconnect as starknetDisconnect } from "get-starknet";

import React from "react"; 
import JobDetail from "./pages/JobDetail";
import EmployerReview from "./pages/EmployerReview";
import JobForm from "./components/JobForm"; 
import BidForm from "./components/BidForm";
import ExploreMarket from "./pages/ExploreMarket";
import MyProjects from "./components/MyProjects";
import Review from "./components/Review";
import CommitMessage from "./components/CommitMessage";
import MyBids from "./components/MyBids";
import BidJobDetail from "./components/BidJobDetail";
import Hire from "./components/Hire";
import LandingPage from "./components/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const background = location.state && location.state.background;
  
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  const [role, setRole] = useState(() => localStorage.getItem("userRole") || null);
  const [address, setAddress] = useState(() => localStorage.getItem("walletAddress") || null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch("https://fairlance.onrender.com/api/jobs/")
      .then(res => res.json())
      .then(data => {
        const results = Array.isArray(data) ? data : (data.results || []);
        setJobs(results);
      })
      .catch(() => setJobs([]));
  }, []);

  const connect = async () => {
    const activeRole = pendingRole || role;
    if (!activeRole) return alert("Please select a role first!");
    setRole(activeRole);
    setIsLoading(true);
    try {
      const starknet = await starknetConnect();
      if (!starknet) { setIsLoading(false); return; }
      await starknet.enable();
      if (starknet.isConnected) {
        setAddress(starknet.selectedAddress);
        localStorage.setItem("walletAddress", starknet.selectedAddress);
        localStorage.setItem("userRole", activeRole);
        if (location.pathname === "/" || location.pathname === "/login") navigate("/ExploreMarket");
      }
    } catch (e) { setIsLoading(false); }
  };

  const disconnect = async () => {
    await starknetDisconnect();
    setAddress(null);
    setRole(null);
    localStorage.clear();
    navigate("/");
  };

  return (
    <>
      <Routes location={background || location}>
        {!role ? (
          <>
            <Route path="/" element={<LandingPage onGetStarted={() => navigate("/login")} />} />
            <Route path="/login" element={<LoginModal isOpen={true} onClose={() => navigate("/")} onSelectRole={setPendingRole} pendingRole={pendingRole} onConnect={connect} loading={isLoading} />} />
          </>
        ) : (
          <Route path="/" element={<MainLayout address={address} connect={connect} switchAccount={connect} disconnect={disconnect} role={role} setRole={setRole} />}>
            <Route index element={<ExploreMarket jobs={jobs} />} />
            <Route path="ExploreMarket" element={<ExploreMarket jobs={jobs} />} />
            <Route path="create-job" element={<JobForm address={address} setJobs={setJobs} jobs={jobs}/>} />
            <Route path="/Myprojects" element={<ProtectedRoute role={role} requiredRole="employer"><MyProjects jobs={jobs} setJobs={setJobs} address={address} /></ProtectedRoute>} />
            <Route path="/MyBids" element={<ProtectedRoute role={role} requiredRole="freelancer"><MyBids jobs={jobs} address={address} /></ProtectedRoute>} />
            {/* Main Job Route */}
            <Route path="jobs/:id" element={<JobDetail jobs={jobs} setJobs={setJobs} address={address} role={role} />} />
            <Route path="Hire/:jobId/:bidder" element={<Hire address={address} setJobs={setJobs} jobs={jobs} />} />
          </Route>
        )}
      </Routes>

      {/* THE MODAL OVERLAY SECTION - FIXED PROPS */}
      {background && (
        <Routes>
          <Route path="/jobs/:id" element={<JobDetail jobs={jobs} setJobs={setJobs} address={address} role={role} />} />
          <Route path="/create-job" element={<JobForm address={address} setJobs={setJobs} jobs={jobs} />} />
          <Route path="/Hire/:jobId/:bidder" element={<Hire address={address} setJobs={setJobs} jobs={jobs}/>} />
        </Routes>
      )}
    </>
  );
}

export default App;