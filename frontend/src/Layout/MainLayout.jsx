import Footer from "../components/Footer";

import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

function MainLayout({ address, connect, disconnect, switchAccount, role, setRole, setJobs }) {
    return (
        <div className="app-layout w-full">


        <Navbar address={address} 
              connect={connect} 
              disconnect={ disconnect}
              switchAccount={switchAccount}
               role={role}
               setRole={setRole}
               setJobs={setJobs} 
               />

        <main className="bg-slate-900 text-slate-100 main-content w-full">
          <Outlet />
        </main>
         <Footer />   
        </div>
    );
}

export default MainLayout;