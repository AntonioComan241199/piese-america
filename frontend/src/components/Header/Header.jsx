import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../slices/authSlice";
import { Link, NavLink } from "react-router-dom";
import "../../styles/Header.css";

const navLinks = [
  {
    path: "/home",
    display: "Home",
  },
  {
    path: "/about",
    display: "About",
  },
  {
    path: "/contact",
    display: "Contact",
  },
];

const Header = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="shadow-sm bg-light bg-gradient">
      {/* Top Header */}
      <div className="bg-dark text-white py-2">
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <span>Ai nevoie de ajutor? </span>
            <span className="fw-bold">
              <i className="ri-phone-fill"></i> 0740 121 689
            </span>
          </div>
          <div>
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="btn btn-sm btn-outline-light"
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/signin" className="text-white text-decoration-none me-3">
                  <i className="ri-login-circle-line"></i> Login
                </Link>
                <Link to="/register" className="text-white text-decoration-none">
                  <i className="ri-user-line"></i> Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Middle Header */}
      <div className="py-3 border-bottom">
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <h1 className="m-0">
              <Link to="/home" className="text-dark text-decoration-none">
                <i className="ri-car-line me-2"></i>
                <span className="fw-bold">Piese Auto America</span>
              </Link>
            </h1>
          </div>
          <div className="text-muted d-none d-md-block">
            <div>
              <i className="ri-map-pin-line me-1"></i>
              București, Marasti Nr.25, Sector 1
            </div>
            <div>
              <i className="ri-time-line me-1"></i>
              Luni - Vineri, 09:00 - 18:00
            </div>
          </div>
          <div>
            <Link to="/contact" className="btn btn-primary">
              <i className="ri-phone-line me-1"></i> Ai o problemă?
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-white py-2">
        <div className="container d-flex justify-content-between align-items-center">
          <ul className="nav">
            {navLinks.map((item, index) => (
              <li key={index} className="nav-item">
                <NavLink
                  to={item.path}
                  className="nav-link"
                  activeClassName="active"
                >
                  {item.display}
                </NavLink>
              </li>
            ))}

            {!isAuthenticated ? (
              <li className="nav-item">
                <NavLink to="/signin" className="nav-link">
                  Comenzile mele
                </NavLink>
              </li>
            ) : user?.role === "client" ? (
              <li className="nav-item">
                <NavLink to="/my-orders" className="nav-link">
                  Comenzile mele
                </NavLink>
              </li>
            ) : user?.role === "admin" ? (
              <li className="nav-item">
                <NavLink to="/all-orders" className="nav-link">
                  Comenzi clienți
                </NavLink>
              </li>
            ) : null}

            {isAuthenticated && (
              <li className="nav-item">
                <NavLink to="/my-profile" className="nav-link">
                  Contul meu
                </NavLink>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center">
            <input
              type="text"
              className="form-control form-control-sm me-2"
              placeholder="Search"
            />
            <button className="btn btn-sm btn-outline-secondary">
              <i className="ri-search-line"></i>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
