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
  
  // THE .FILTER FIX: Force initialization to an empty array even if LocalStorage is broken
  const [jobs, setJobs] = useState(() => {
    try {
      const stored = localStorage.getItem("jobs");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  // Fetch real data from Backend on mount to overwrite local junk
  useEffect(() => {
    fetch("https://fairlance.onrender.com/api/jobs/")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setJobs(data);
      })
      .catch(err => console.error("Initial fetch failed:", err));
  }, []);

  useEffect(() => {
    localStorage.setItem("jobs", JSON.stringify(Array.isArray(jobs) ? jobs : []));
    if (role) localStorage.setItem("userRole", role);
    else localStorage.removeItem("userRole");
  }, [jobs, role]);

  const handleRoleSelection = (selectedRole) => {
    setPendingRole(selectedRole);
  };

  const connect = async () => {
    const activeRole = pendingRole || role;
    if (!activeRole) return alert("Please select a role first!");

    setIsLoading(true);
    // UI FIX: Close modal instantly
    setRole(activeRole);
    localStorage.setItem("userRole", activeRole);

    try {
      const starknet = await starknetConnect();
      if (!starknet) {
        setIsLoading(false);
        return;
      }
      
      await starknet.enable();

      if (starknet.isConnected) {
        const userAddress = starknet.selectedAddress;
        setAddress(userAddress);
        localStorage.setItem("walletAddress", userAddress);

        if (location.pathname === "/" || location.pathname === "/login") {
            navigate("/ExploreMarket");
        }
      }
    } catch (error) {
      console.error("Connection failed:", error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    await starknetDisconnect();
    setAddress(null);
    setRole(null);
    localStorage.clear();
    navigate("/");
  };

  const switchAccount = async () => { await connect(); };

  // Re-added the Lead's Wrapper for Job Details
  function JobDetailWrapper({ jobs, setJobs, address }) {
    const handleReveal = (updatedJob) => {
      const newJobs = Array.isArray(jobs) ? jobs.map(j => (j.id === updatedJob.id ? updatedJob : j)) : [];
      setJobs(newJobs);
    };
    return <JobDetail jobs={Array.isArray(jobs) ? jobs : []} setJobs={setJobs} address={address} onSubmitReveal={handleReveal} />;
  }

  // Safety helper for rendering components
  const safeJobs = Array.isArray(jobs) ? jobs : [];

  return (
    <>
      <Routes location={background || location}>
        {!role ? (
          <>
            <Route path="/" element={<LandingPage onGetStarted={() => navigate("/login", { state: { background: location } })} />} />
            <Route path="/login" element={<LoginModal isOpen={true} onClose={() => navigate("/")} onSelectRole={handleRoleSelection} pendingRole={pendingRole} onConnect={connect} setPendingRole={setPendingRole} loading={isLoading} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <Route path="/" element={<MainLayout address={address} connect={connect} switchAccount={switchAccount} disconnect={disconnect} role={role} setRole={setRole} />}>
            <Route index element={<ExploreMarket jobs={safeJobs} />} />
            <Route path="ExploreMarket" element={<ExploreMarket jobs={safeJobs} />} />
            <Route path="/Myprojects" element={<ProtectedRoute role={role} requiredRole="employer"><MyProjects jobs={safeJobs} setJobs={setJobs} address={address} /></ProtectedRoute>} />
            <Route path="/MyBids" element={<ProtectedRoute role={role} requiredRole="freelancer"><MyBids jobs={safeJobs} address={address} /></ProtectedRoute>} />
            <Route path="jobs/:id" element={<JobDetailWrapper jobs={safeJobs} setJobs={setJobs} address={address} />}>
              <Route path="commit-message" element={<CommitMessage jobs={safeJobs} setJobs={setJobs} address={address}/>} />
            </Route>
            <Route path="/review/:jobId" element={<Review jobs={safeJobs} />} />
            <Route path="employer-review" element={<EmployerReview />} />
            <Route path="create-job" element={<JobForm address={address} setJobs={setJobs} jobs={safeJobs}/>} />
            <Route path="MyBids/jobDetail" element={<BidJobDetail jobs={safeJobs} address={address} role={role} />} />
            <Route path="Hire/:jobId/:bidder" element={<Hire address={address} setJobs={setJobs} jobs={safeJobs} />} />
            <Route path="Bidform" element={<BidForm />} />
            <Route path="login" element={<Navigate to="/ExploreMarket" replace />} />
          </Route>
        )}
      </Routes>

      {background && (
        <Routes>
          <Route path="/login" element={<LoginModal isOpen={true} onClose={() => navigate(-1)} onSelectRole={handleRoleSelection} pendingRole={pendingRole} onConnect={connect} setPendingRole={setPendingRole} loading={isLoading}/>} />
          <Route path="/jobs/:id" element={<JobDetailWrapper jobs={safeJobs} setJobs={setJobs} address={address} role={role} />} />
          <Route path="/create-job" element={<JobForm address={address} setJobs={setJobs} jobs={safeJobs} />} />
          <Route path="/review/:jobId" element={<Review jobs={safeJobs} setJobs={setJobs} address={address} />} />
          <Route path="/Hire/:jobId/:bidder" element={<Hire address={address} setJobs={setJobs} jobs={safeJobs}/>} />
        </Routes>
      )}
    </>
  );
}

export default App;