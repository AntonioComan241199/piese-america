import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authChecked } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!authChecked) return null; // Așteaptă verificarea autentificării

  // Dacă nu este autentificat, salvează URL-ul curent pentru a redirecționa ulterior
  if (!isAuthenticated) {
    localStorage.setItem('redirectTo', location.pathname + location.search);
    return <Navigate to="/signin" replace />;
  }

  return children;
};
