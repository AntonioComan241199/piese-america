import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Spinner } from "react-bootstrap"; // Importă spinner-ul

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authChecked } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!authChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" /> {/* Spinner pentru încărcare */}
      </div>
    );
  }

  if (!isAuthenticated) {
    localStorage.setItem('redirectTo', location.pathname + location.search);
    return <Navigate to="/signin" replace />;
  }

  return children;
};

