import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, role, requiredRole }) => {
  const location = useLocation();

  if (role !== requiredRole) {
    // Redirect to a safe common page, like the Market
    return <Navigate to="/ExploreMarket" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;