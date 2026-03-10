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

  // Fetch Jobs from Django
  const fetchJobs = () => {
    fetch("https://fairlance.onrender.com/api/jobs/")
      .then(res => res.json())
      .then(data => {
        const results = Array.isArray(data) ? data : (data.results || []);
        setJobs(results);
      })
      .catch(err => console.error("Fetch Error:", err));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const connect = async () => {
    const activeRole = pendingRole || role;
    if (!activeRole) return alert("Please select a role first!");
    setIsLoading(true);
    setRole(activeRole);
    localStorage.setItem("userRole", activeRole);

    try {
      const starknet = await starknetConnect();
      if (!starknet) { setIsLoading(false); return; }
      await starknet.enable();
      if (starknet.isConnected) {
        setAddress(starknet.selectedAddress);
        localStorage.setItem("walletAddress", starknet.selectedAddress);
        if (location.pathname === "/" || location.pathname === "/login") navigate("/ExploreMarket");
      }
    } catch (e) { setIsLoading(false); } finally { setIsLoading(false); }
  };

  const disconnect = async () => {
    await starknetDisconnect();
    setAddress(null);
    setRole(null);
    localStorage.clear();
    navigate("/");
  };

  // FIX: Force selection modal for Switching Accounts
  const switchAccount = async () => {
    const starknet = await starknetConnect({ modalMode: "alwaysAsk" });
    if (starknet) {
      await starknet.enable();
      setAddress(starknet.selectedAddress);
      localStorage.setItem("walletAddress", starknet.selectedAddress);
    }
  };

  const safeJobs = Array.isArray(jobs) ? jobs : [];

  return (
    <>
      <Routes location={background || location}>
        {!role ? (
          <>
            <Route path="/" element={<LandingPage onGetStarted={() => navigate("/login")} />} />
            <Route path="/login" element={<LoginModal isOpen={true} onClose={() => navigate("/")} onSelectRole={setPendingRole} pendingRole={pendingRole} onConnect={connect} setPendingRole={setPendingRole} loading={isLoading} />} />
          </>
        ) : (
          <Route path="/" element={<MainLayout address={address} connect={connect} switchAccount={switchAccount} disconnect={disconnect} role={role} setRole={setRole} />}>
            <Route index element={<ExploreMarket jobs={safeJobs} />} />
            <Route path="ExploreMarket" element={<ExploreMarket jobs={safeJobs} />} />
            <Route path="create-job" element={<JobForm address={address} onCreated={fetchJobs} />} />
            <Route path="/Myprojects" element={<ProtectedRoute role={role} requiredRole="employer"><MyProjects jobs={safeJobs} address={address} /></ProtectedRoute>} />
            <Route path="/MyBids" element={<ProtectedRoute role={role} requiredRole="freelancer"><MyBids jobs={safeJobs} address={address} /></ProtectedRoute>} />
            <Route path="jobs/:id" element={<JobDetail jobs={safeJobs} address={address} role={role} onUpdate={fetchJobs} />} />
            <Route path="Hire/:jobId/:bidder" element={<Hire address={address} setJobs={setJobs} jobs={safeJobs} onUpdate={fetchJobs} />} />
          </Route>
        )}
      </Routes>

      {background && (
        <Routes>
          <Route path="/jobs/:id" element={<JobDetail jobs={safeJobs} address={address} role={role} onUpdate={fetchJobs} />} />
          <Route path="/create-job" element={<JobForm address={address} onCreated={fetchJobs} />} />
        </Routes>
      )}
    </>
  );
}

export default App;