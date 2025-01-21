import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Nav, Button } from "react-bootstrap";

const Sidebar = ({ isAuthenticated, user, onLogout, navLinks }) => {
  return (
<div
  className="d-none d-lg-flex flex-column bg-dark text-white vh-100"
  style={{
    position: "fixed",
    top: "0",
    left: "0",
    width: "240px", // Lățimea Sidebar-ului
    zIndex: "1000",
  }}
>

      <h2 className="p-3">
        <Link to="/home" className="text-white text-decoration-none">
          <i className="ri-car-line me-2"></i>Piese Auto America
        </Link>
      </h2>
      <Nav className="flex-column px-3">
        
        {navLinks.map((item, index) => (
          item.path === "/request-order" && isAuthenticated && user?.role === "admin" ? null : (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) => (isActive ? "nav-link active bg-primary text-white" : "nav-link text-white")}
            >
              {item.display}
            </NavLink>
          )
        ))}
        {isAuthenticated && (
          <>
            {user?.role === "client" && (
              <>
                <NavLink to="/my-orders" className={({ isActive }) => isActive ? "nav-link active bg-primary text-white" : "nav-link text-white"}
                >
                  Evidenta Oferte
                </NavLink>
                <NavLink to="/my-offers" className={({ isActive }) => isActive ? "nav-link active bg-primary text-white" : "nav-link text-white"}
                >
                  Evidenta Comenzi
                </NavLink>
              </>
            )}
            {user?.role === "admin" && (
              <>
                <NavLink to="/admin-orders" className={({ isActive }) => isActive ? "nav-link active bg-primary text-white" : "nav-link text-white"}
                >
                  Evidenta Oferte
                </NavLink>
                <NavLink to="/admin-offers" className={({ isActive }) => isActive ? "nav-link active bg-primary text-white" : "nav-link text-white"}
                >
                  Evidenta Comenzi
                </NavLink>
              </>
            )}
            <NavLink to="/my-profile" className={({ isActive }) => isActive ? "nav-link active bg-primary text-white" : "nav-link text-white"}
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
        {!isAuthenticated && (
          <>
            <NavLink to="/signin" className="nav-link">
              Login
            </NavLink>
            <NavLink to="/register" className="nav-link">
              Register
            </NavLink>
          </>
        )}
      </Nav>
    </div>
  );
};

export default Sidebar;