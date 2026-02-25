import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

function MainLayout({ address, connect, disconnect, switchAccount, role, setRole, setJobs }) {
    return (
        <div className="app-layout">

        <Navbar address={address} 
              connect={connect} 
              disconnect={ disconnect}
              switchAccount={switchAccount}
               role={role}
               setRole={setRole}
               setJobs={setJobs} 
               />

        <main className="main-content">
          <Outlet />
        </main>
         <Footer />   
        </div>
    );
}

export default MainLayout;