import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Spinner } from "react-bootstrap"; // ✅ Adăugat pentru consistență

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, authChecked } = useSelector((state) => state.auth);
  const location = useLocation();

  // Așteaptă finalizarea verificării autentificării
  if (!authChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // Dacă utilizatorul este deja autentificat, redirecționează-l la ultima pagină accesată
  if (isAuthenticated) {
    const redirectTo = localStorage.getItem("redirectTo") || "/home"; // ✅ Fallback la /home
    localStorage.removeItem("redirectTo"); // ✅ Curăță URL-ul salvat după redirecționare
    console.log("Redirecting to:", redirectTo); // ✅ Debugging info
    return <Navigate to={redirectTo} replace />;
  }

  // Dacă utilizatorul nu este autentificat, salvăm URL-ul curent pentru redirecționare ulterioară
  const publicPages = ["/signin", "/register", "/reset-password"];
  if (!publicPages.includes(location.pathname)) {
    localStorage.setItem("redirectTo", location.pathname + location.search);
  }

  return children; // ✅ Permite accesul la ruta publică (de exemplu, /signin)
};
