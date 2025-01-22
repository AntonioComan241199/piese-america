import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Nav, Button } from "react-bootstrap";
import PropTypes from "prop-types";

const Sidebar = ({ isAuthenticated, user, onLogout, navLinks = [] }) => {
  return (
    <div
      className="sidebar bg-dark text-white"
      style={{
        position: "fixed",
        top: "75px", // Înălțimea TopHeader
        left: "0",
        width: "240px", // Lățimea Sidebar-ului
        height: "calc(100vh - 75px)", // Ajustează înălțimea să nu depășească pagina
        zIndex: "1000",
        overflowY: "auto", // Scroll pentru conținut lung
      }}
    >
      <h2 className="p-3">
        <Link to="/home" className="text-white text-decoration-none">
          <i className="ri-car-line me-2"></i>Piese Auto America
        </Link>
      </h2>
      <Nav className="flex-column px-3">
        {/* Link-uri generale */}
        {navLinks.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "nav-link active bg-primary text-white" : "nav-link text-white"
            }
          >
            {item.display}
          </NavLink>
        ))}

        {/* Link-uri suplimentare pentru utilizatori autentificați */}
        {isAuthenticated && (
          <>
            {user?.role === "client" && (
              <>
                <NavLink
                  to="/my-orders"
                  className={({ isActive }) =>
                    isActive ? "nav-link active bg-primary text-white" : "nav-link text-white"
                  }
                >
                  Evidenta Oferte
                </NavLink>
                <NavLink
                  to="/my-offers"
                  className={({ isActive }) =>
                    isActive ? "nav-link active bg-primary text-white" : "nav-link text-white"
                  }
                >
                  Evidenta Comenzi
                </NavLink>
              </>
            )}
            {user?.role === "admin" && (
              <>
                <NavLink
                  to="/admin-orders"
                  className={({ isActive }) =>
                    isActive ? "nav-link active bg-primary text-white" : "nav-link text-white"
                  }
                >
                  Evidenta Oferte
                </NavLink>
                <NavLink
                  to="/admin-offers"
                  className={({ isActive }) =>
                    isActive ? "nav-link active bg-primary text-white" : "nav-link text-white"
                  }
                >
                  Evidenta Comenzi
                </NavLink>
              </>
            )}
            <NavLink
              to="/my-profile"
              className={({ isActive }) =>
                isActive ? "nav-link active bg-primary text-white" : "nav-link text-white"
              }
            >
              Contul meu
            </NavLink>
            <Button
              onClick={onLogout}
              variant="outline-light"
              size="sm"
              className="mt-3"
            >
              Logout
            </Button>
          </>
        )}

        {/* Link-uri pentru utilizatori neautentificați */}
        {!isAuthenticated && (
          <>
            <NavLink
              to="/signin"
              className={({ isActive }) =>
                isActive ? "nav-link active bg-primary text-white" : "nav-link text-white"
              }
            >
              Login
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) =>
                isActive ? "nav-link active bg-primary text-white" : "nav-link text-white"
              }
            >
              Register
            </NavLink>
          </>
        )}
      </Nav>
    </div>
  );
};

Sidebar.propTypes = {
  isAuthenticated: PropTypes.bool,
  user: PropTypes.object,
  onLogout: PropTypes.func,
  navLinks: PropTypes.array.isRequired,
};

export default Sidebar;
