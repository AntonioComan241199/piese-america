import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, authChecked } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!authChecked) return <div>Loading...</div>; // Așteaptă completarea verificării autentificării

  // Dacă utilizatorul este deja autentificat
  if (isAuthenticated) {
    // Verificăm dacă există un URL salvat în localStorage pentru redirecționare
    const redirectTo = localStorage.getItem('redirectTo') || '/home'; // Folosește /home ca fallback
    localStorage.removeItem('redirectTo'); // Curăță URL-ul salvat după redirecționare
    console.log("Redirecting to:", redirectTo); // Verificare debug
    return <Navigate to={redirectTo} replace />; // Redirecționează utilizatorul
  }

  // Dacă utilizatorul nu este autentificat, salvăm URL-ul curent în localStorage pentru a-l redirecționa ulterior
  if (location.pathname !== '/signin') {
    localStorage.setItem('redirectTo', location.pathname + location.search); 
  }

  return children; // Permite accesul la ruta publică (de exemplu, /signin)
};
