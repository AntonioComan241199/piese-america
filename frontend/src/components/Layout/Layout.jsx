import React, { useEffect, useState } from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";

const Layout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 991);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 991);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <Header />
      <main
        className="container-fluid"
        style={{
          marginLeft: "120px", // Spațiu pentru Sidebar pe desktop
          padding: "5px",
        }}
      >
        <div className="row justify-content-center">
          <div className="col-xl-8 col-lg-10 col-md-12">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Layout;
