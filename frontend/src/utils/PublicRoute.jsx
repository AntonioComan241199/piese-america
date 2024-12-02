import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, authChecked } = useSelector((state) => state.auth);

  if (!authChecked) return null; // Așteaptă verificarea autentificării
  if (isAuthenticated) return <Navigate to="/home" replace />;

  return children;
};