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
  const [jobs, setJobs] = useState(() => {
    const stored = localStorage.getItem("jobs");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("jobs", JSON.stringify(jobs));
    if (role) localStorage.setItem("userRole", role);
    else localStorage.removeItem("userRole");
  }, [jobs, role]);

  const handleRoleSelection = (selectedRole) => {
    setPendingRole(selectedRole);
  };

  const connect = async () => {
    if (!pendingRole) {
      return alert("Please select a role first!");
    }

    setIsLoading(true);
    try {
      // Real Starknet Connection
      const starknet = await starknetConnect();
      if (!starknet) return;
      
      await starknet.enable();

      if (starknet.isConnected) {
        const userAddress = starknet.selectedAddress;
        setAddress(userAddress);
        setRole(pendingRole);

        localStorage.setItem("walletAddress", userAddress);
        localStorage.setItem("userRole", pendingRole);

        navigate("/ExploreMarket");
      }
    } catch (error) {
      console.error("Connection failed:", error);
      alert("Failed to connect wallet.");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    await starknetDisconnect();
    setAddress(null);
    setRole(null);
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const switchAccount = async () => {
    // Re-trigger the wallet selection modal
    await connect();
  };

  function JobDetailWrapper({ jobs, setJobs, address }) {
    const handleReveal = (updatedJob) => {
      const newJobs = jobs.map(j => (j.id === updatedJob.id ? updatedJob : j));
      setJobs(newJobs);
    };
    return <JobDetail jobs={jobs} setJobs={setJobs} address={address} onSubmitReveal={handleReveal} />;
  }

  return (
    <>
      <Routes location={background || location}>
        {!role ? (
          <>
            <Route 
              path="/" 
              element={<LandingPage onGetStarted={() => navigate("/login", { state: { background: location } })} />} 
            />
            <Route 
              path="/login" 
              element={<LoginModal isOpen={true} onClose={() => navigate("/")} onSelectRole={handleRoleSelection} pendingRole={pendingRole} onConnect={connect} setPendingRole={setPendingRole} loading={isLoading} />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <Route path="/" element={<MainLayout address={address} connect={connect} switchAccount={switchAccount} disconnect={disconnect} role={role} setRole={setRole} />}>
            <Route index element={<ExploreMarket jobs={jobs} />} />
            <Route path="ExploreMarket" element={<ExploreMarket jobs={jobs} />} />
            <Route path="/Myprojects" element={<ProtectedRoute role={role} requiredRole="employer"><MyProjects jobs={jobs} setJobs={setJobs} address={address} /></ProtectedRoute>} />
            <Route path="/MyBids" element={<ProtectedRoute role={role} requiredRole="freelancer"><MyBids jobs={jobs} address={address} /></ProtectedRoute>} />
            <Route path="jobs/:id" element={<JobDetailWrapper jobs={jobs} setJobs={setJobs} address={address} />}>
              <Route path="commit-message" element={<CommitMessage jobs={jobs} setJobs={setJobs} address={address}/>} />
            </Route>
            <Route path="/review/:jobId" element={<Review jobs={jobs} />} />
            <Route path="employer-review" element={<EmployerReview />} />
            <Route path="create-job" element={<JobForm address={address} setJobs={setJobs}/>} />
            <Route path="MyBids" element={<MyBids jobs={jobs} address={address} role={role} />} />
            <Route path="MyBids/jobDetail" element={<BidJobDetail jobs={jobs} address={address} role={role} />} />
            <Route path="Hire/:jobId/:bidder" element={<Hire address={address} setJobs={setJobs} jobs={jobs} />} />
            <Route path="Bidform" element={<BidForm />} />
            <Route path="login" element={<Navigate to="/ExploreMarket" replace />} />
          </Route>
        )}
      </Routes>

      {background && (
        <Routes>
          <Route path="/login" element={<LoginModal isOpen={true} onClose={() => navigate(-1)} onSelectRole={handleRoleSelection} pendingRole={pendingRole} onConnect={connect} setPendingRole={setPendingRole} loading={isLoading}/>} />
          <Route path="/jobs/:id" element={<JobDetailWrapper jobs={jobs} setJobs={setJobs} address={address} role={role} />} />
          <Route path="/create-job" element={<JobForm address={address} setJobs={setJobs} />} />
          <Route path="/review/:jobId" element={<Review jobs={jobs} setJobs={setJobs} address={address} />} />
          <Route path="/Hire/:jobId/:bidder" element={<Hire address={address} setJobs={setJobs} jobs={jobs}/>} />
        </Routes>
      )}
    </>
  );
}

export default App;