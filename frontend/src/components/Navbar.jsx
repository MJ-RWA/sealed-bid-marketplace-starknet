import { Link, useLocation} from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { faWallet } from "@fortawesome/free-solid-svg-icons";
import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import "./Navbar.css";
import RoleSwitcher from "./RoleSwitcher";

function Navbar({ address, connect, disconnect, switchAccount, role, setRole }) {
    const location = useLocation();
     const shortenAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

    return (

   
    <nav class="navbar">

     
      <div class="nav-left">
        
        <div class="logo">
          <FontAwesomeIcon icon={faLock} size="3x"/>
        </div>

        <div class="brand-text">
          <h1>
           Fairlance
          </h1>
          <p>
            {role === "employer" && "EMPLOYER DASHBOARD"}
            {role === "freelancer" && "FREELANCER WORKSPACE"}
            </p>
        </div>
      </div>

<div></div>
      
      <div className="nav-right">

        
        {/* <div class="role-switcher" id="roleSwitcher">
          <div class="slider"></div>
          <button class="active" data-role="employer">Employer</button>
          <button data-role="freelancer">Freelancer</button>
          
        </div> */}

        {address && (
         <>
      <RoleSwitcher role={role} setRole={setRole}/>

        </>
        )}

      </div>

      <div class="nav-links">


        {role === "employer" && (
            <> 
        <div class="myprojects">
          <Link to="Myprojects">My Projects </Link>
          <span className="divider">|</span>
        </div>
         </>
     )}


         {role === "employer" && (
            <>
       <Link to="/create-job" state={{ background: location }}>
      Post a Job
       </Link>
     <span className="divider">|</span>
       </>
     )}
        
       
       <div>
           <Link to="/ExploreMarket">Explore Market</Link>
           <span className="divider">|</span>
       </div>
   

    {role === "freelancer" && (
    
       <div class="mybids">
            <Link to="/MyBids">My Bids</Link> 
       </div>

    )}
       </div>

      <div className="walletnav-wrapper">

  {/* If NOT connected */}
  {!address && (
    <div className="connect-wallet">
      <button onClick={connect} className="wallet1">
       <FontAwesomeIcon icon={faWallet} /> Connect Wallet
      </button>
    </div>
  )}

  {/* If connected */}
  {address && (
   <>

    <div className="walletnav">
      <div className="wallet">
        <div className="wallet-info">
          <span className="Strk">WALLET ADDRESS</span>
          <span className="address">{shortenAddress(address)}</span>
        </div>

        <div className="wallet-actions">
          <button onClick={switchAccount} className="butt">
            <FontAwesomeIcon style={{color:"var(--text-primary)"}} icon={faArrowRightArrowLeft} size="lg" />
          </button>

          <button onClick={disconnect} className="butt">
            <FontAwesomeIcon style={{color:"var(--text-primary)"}} icon={faArrowRightFromBracket} size="lg" />
          </button>
        </div>
      </div>
    </div>
    </>
  )}

</div>
    </nav>

    );
}

export default Navbar;