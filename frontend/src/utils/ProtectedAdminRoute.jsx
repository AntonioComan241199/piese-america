import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const ProtectedAdminRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  
  if (!user) {
    // Dacă utilizatorul nu este autentificat, redirecționează către login
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    // Dacă utilizatorul nu are rol de admin, redirecționează către home
    return <Navigate to="/" replace />;
  }

  // Dacă utilizatorul este admin, permite accesul la rută
  return children;
};