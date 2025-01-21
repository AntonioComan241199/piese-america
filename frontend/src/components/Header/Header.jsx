import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout, checkAuth } from "../../slices/authSlice";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import TopHeader from "./TopHeader";
import Sidebar from "./Sidebar";
import MobileNavbar from "./MobileNavbar";
import "../../styles/Header.css";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, authChecked } = useSelector((state) => state.auth);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 991);

  const navLinks = [
    { path: "/home", display: "Home" },
    { path: "/contact", display: "Contact" },
    { path: "/request-order", display: "Solicita oferta" },
    { path: "/oil-products", display: "Uleiuri si Lubrifianti" },
  ];

  useEffect(() => {
    if (!authChecked) {
      dispatch(checkAuth());
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 991);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch, authChecked]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/signin");
  };

  return (
    <header>
      <TopHeader isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />
      {isMobile ? (
        <MobileNavbar isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} navLinks={navLinks} />
      ) : (
        <Sidebar isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} navLinks={navLinks} />
      )}
    </header>
  );
};

export default Header;
