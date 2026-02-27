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
  <nav className={`navbar ${role === "freelancer" ? "freelancer-active" : "employer-active"}`}>
    <div className="nav-top-row">
      <div className="nav-left">
        <div className="logo">
          <FontAwesomeIcon icon={faLock} size="3x" className="icon-role" />
        </div>
        <div className="brand-text">
          <h1>Fairlance</h1>
          <p>{role === "employer" ? "EMPLOYER DASHBOARD" : "FREELANCER WORKSPACE"}</p>
        </div>
      </div>

      <div className="nav-right">
        {address && <RoleSwitcher role={role} setRole={setRole} />}
      </div>
    </div>

    <div className="nav-bottom-row">
      <div className="nav-links">
        {role === "employer" && (
          <>
            <Link to="/MyProjects" className="mypronav">My Projects</Link>
            <span className="divider">|</span>
            <Link to="/create-job" className="mypronav">Post a Job</Link>
            <span className="divider">|</span>
          </>
        )}
        <Link to="/ExploreMarket" className="mypronav">Explore Market</Link>
        {role === "freelancer" && (
          <>
            <span className="divider">|</span>
            <Link to="/MyBids" className="mypronav">My Bids</Link>
          </>
        )}
      </div>

      <div className="walletnav-wrapper">
        {!address ? (
          <button onClick={connect} className="wallet1">
            <FontAwesomeIcon icon={faWallet} /> Connect
          </button>
        ) : (
          <div className="wallet">
            <div className="wallet-info">
              <span className="address">{shortenAddress(address)}</span>
            </div>
            <div className="wallet-actions">
              <button onClick={switchAccount} className="butt"><FontAwesomeIcon icon={faArrowRightArrowLeft} /></button>
              <button onClick={disconnect} className="butt"><FontAwesomeIcon icon={faArrowRightFromBracket} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  </nav>
);
}

export default Navbar;