import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../slices/authSlice";
import { useEffect } from "react";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authChecked } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      dispatch(logout());
      navigate("/signin");
    }
  }, [authChecked, isAuthenticated, dispatch, navigate]);

  if (!authChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    localStorage.setItem("redirectTo", location.pathname + location.search);
    return <Navigate to="/signin" replace />;
  }

  return children;
};
