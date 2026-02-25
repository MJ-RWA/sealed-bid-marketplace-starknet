import { Routes, Route, useLocation } from "react-router-dom";
import MainLayout from "./Layout/MainLayout"
import { useState, useEffect } from "react";
import { TEST_WALLETS } from "./mockwallet";


import React from "react"; 
import JobBoard from "./pages/JobBoard";
import JobDetail from "./pages/JobDetail";
import EmployerReview from "./pages/EmployerReview";
import JobForm from "./components/JobForm"; 
import BidForm from "./components/BidForm";
import Footer from "./components/Footer";
import ExploreMarket from "./pages/ExploreMarket";
import MyProjects from "./components/MyProjects";
import Review from "./components/Review";
import CommitMessage from "./components/CommitMessage";
import MyBids from "./components/MyBids";
import BidJobDetail from "./components/BidJobDetail";
import Hire from "./components/Hire";
import Navbar from "./components/Navbar";

function App() {
  const [role, setRole] = useState(() => {
  return localStorage.getItem("userRole") || null;
});

  const location = useLocation();
  const background = location.state && location.state.background;
 const [walletIndex, setWalletIndex] = useState(0);
 const [address, setAddress] = useState(() => {
    // initialize from localStorage
    return localStorage.getItem("walletAddress") || null;
  });

  useEffect(() => {
    const stored = localStorage.getItem("walletAddress");
    if (stored) {
      const index = TEST_WALLETS.indexOf(stored);
      if (index >= 0) setWalletIndex(index);
    }
  }, []);
 
  useEffect(() => {
  if (role) {
    localStorage.setItem("userRole", role);
  } else {
    localStorage.removeItem("userRole");
  }
}, [role]);

 const connect = () => {
  const wallet = TEST_WALLETS[walletIndex];
  setAddress(wallet);
  setRole("EMPLOYER"); // default role when connected
  localStorage.setItem("walletAddress", wallet);
  

};


const disconnect = () => {
  setAddress(null);
   setRole(null);
  localStorage.removeItem("walletAddress");
};


 const switchAccount = () => {
    const next = (walletIndex + 1) % TEST_WALLETS.length;
    setWalletIndex(next);
    const wallet = TEST_WALLETS[next];
    setAddress(wallet);
    localStorage.setItem("walletAddress", wallet); // persist
  


};


function JobDetailWrapper({ jobs, setJobs, address }) {
  const handleReveal = (updatedJob) => {
    const newJobs = jobs.map(j => (j.id === updatedJob.id ? updatedJob : j));
    setJobs(newJobs);
  };

  return (
    <JobDetail
      jobs={jobs}
      setJobs={setJobs}
      address={address}
      onSubmitReveal={handleReveal} // ✅ pass the function as a prop
    />
  );
}

const [jobs, setJobs] = useState(() => {
  const stored = localStorage.getItem("jobs");
  return stored ? JSON.parse(stored) : [];
});

useEffect(() => {
  localStorage.setItem("jobs", JSON.stringify(jobs));
}, [jobs]);

  return (

    <>


    
      
      
      
      <Routes location={background || location}>
      <Route path="/" element={<MainLayout address={address} connect={connect} switchAccount={switchAccount} disconnect={disconnect}  role={role} setRole={setRole} />}>
        <Route index element={<ExploreMarket jobs={jobs} />} />
        <Route path="jobs/:id" element={<JobDetailWrapper jobs={jobs} setJobs={setJobs} address={address} />}>
         <Route path="commit-message" element={<CommitMessage jobs={jobs} setJobs={setJobs} address={address}/>} />
        </Route>
        <Route path="ExploreMarket" element={<ExploreMarket jobs={jobs} />} />
        <Route path="employer-review" element={<EmployerReview />} />
        <Route path="Myprojects" element={<MyProjects jobs={jobs} setJobs={setJobs} address={address}/>} />
        <Route path="/review/:jobId" element={<Review jobs={jobs} setJobs={setJobs} address={address}  />} />
        <Route path="create-job" element={<JobForm address={address} setJobs={setJobs}/>} />
        <Route path="MyBids" element={<MyBids jobs={jobs} />} />
        <Route path="MyBids/jobDetail" element={<BidJobDetail jobs={jobs} />} />
        <Route path="/Hire/:jobId/:bidder" element={<Hire address={address} setJobs={setJobs} jobs={jobs} />} />
        <Route path="Bidform" element={<BidForm />} />
      </Route>
    </Routes>
  

    {/* Overlay modal routes */}
      {background && (
        <Routes>
          <Route path="/jobs/:id" element={<JobDetailWrapper jobs={jobs} setJobs={setJobs} address={address}/>} />
          <Route path="/jobs/:id/commit-message" element={<CommitMessage jobs={jobs } setJobs={setJobs} address={address}/>} />
          <Route path="/create-job" element={<JobForm address={address} setJobs={setJobs} />} />
          <Route path="/review/:jobId" element={<Review jobs={jobs} setJobs={setJobs} address={address} />} />
          <Route path="MyBids/jobDetail" element={<BidJobDetail  jobs={jobs}/>} />
          <Route path="/Hire/:jobId/:bidder" element={<Hire address={address} setJobs={setJobs} jobs={jobs}/>} />
        </Routes>
      )}


   </>
  );
}

export default App;
