import { Navigate } from "react-router-dom";

const MobileOnlyRoute = ({ children }) => {
  const isMobileOrTablet = window.innerWidth < 1024; // Tailwind lg breakpoint

  return isMobileOrTablet ? children : <Navigate to="/" replace />;
};

export default MobileOnlyRoute;
