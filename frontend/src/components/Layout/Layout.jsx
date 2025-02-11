import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import Sidebar from "../Header/Sidebar";
import { logout } from "../../slices/authSlice";

const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 991);

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 991);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <>
      <Header />
      <div className="d-flex" style={{ minHeight: "100vh" }}>
        {/* Sidebar vizibil doar pe desktop */}
        {!isMobile && (
          <Sidebar
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={handleLogout}
            navLinks={[
              { path: "/home", display: "Home" },
              { path: "/contact", display: "Contact" },
              { path: "/request-order", display: "Solicita oferta" },
              { path: "/oil-products", display: "Uleiuri si Lubrifianti" },
              { path: "/fire-products", display: "Stingatoare" },
            ]}
          />
        )}

        {/* Conținut principal */}
        <main
          style={{
            marginLeft: isMobile ? "0" : "240px",
            padding: "15px",
            width: isMobile ? "100%" : "calc(100% - 240px)",
            flex: "1", // Asigură extinderea pe toată înălțimea disponibilă
          }}
        >
          <div className="container-fluid">
            <div className="row justify-content-center">
              <div className="col-xl-8 col-lg-10 col-md-12">{children}</div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default Layout;
