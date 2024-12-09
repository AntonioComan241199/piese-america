import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, authChecked } = useSelector((state) => state.auth);
  const location = useLocation(); // Obținem locația curentă

  if (!authChecked) return null; // Așteaptă verificarea autentificării
  if (isAuthenticated) return <Navigate to="/home" replace />; // Redirecționează către home dacă utilizatorul este deja autentificat

  // Salvăm URL-ul curent în localStorage sau într-un alt stat global (dacă vrei să-l folosești ulterior)
  if (!isAuthenticated) {
    localStorage.setItem('redirectTo', location.pathname + location.search); // Salvăm URL-ul curent
  }

  return children; // Dacă nu este autentificat, lasă să continue accesul la ruta publică (ex. /signin)
};
