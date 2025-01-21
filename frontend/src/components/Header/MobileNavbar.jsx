import React from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { NavLink, Link } from "react-router-dom";
import PropTypes from "prop-types";

const MobileNavbar = ({ isAuthenticated, user, onLogout, navLinks = [] }) => {
  return (
    <Navbar expand="lg" bg="dark" variant="dark" className="d-lg-none">
      <Container>
        <Navbar.Brand>
          <Link to="/home" className="text-white text-decoration-none">
            <i className="ri-car-line me-2"></i>Piese Auto America
          </Link>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="mobile-navbar">
          <i className="ri-menu-line"></i> <span className="ms-2">Meniu</span>
        </Navbar.Toggle>
        <Navbar.Collapse id="mobile-navbar">
          <Nav className="ms-auto">
            {/* Navigație generală */}
            {navLinks.map((item, index) => (
              <Nav.Link
                key={index}
                as={NavLink}
                to={item.path}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {item.display}
              </Nav.Link>
            ))}

            {/* Link-uri speciale pentru utilizatori autentificați */}
            {isAuthenticated && user?.role === "client" && (
              <>
                <Nav.Link as={NavLink} to="/my-orders">
                  Cererile mele
                </Nav.Link>
                <Nav.Link as={NavLink} to="/my-offers">
                  Oferte primite
                </Nav.Link>
              </>
            )}

            {/* Link-uri speciale pentru administratori */}
            {isAuthenticated && user?.role === "admin" && (
              <>
                <Nav.Link as={NavLink} to="/admin-orders">
                  Cereri Ofertare
                </Nav.Link>
                <Nav.Link as={NavLink} to="/admin-offers">
                  Management Oferte
                </Nav.Link>
              </>
            )}

            {/* Cont și Logout */}
            {isAuthenticated && (
              <>
                <Nav.Link as={NavLink} to="/my-profile">
                  Contul meu
                </Nav.Link>
                <Button
                  onClick={onLogout}
                  variant="outline-light"
                  size="sm"
                  className="mt-2"
                >
                  Logout
                </Button>
              </>
            )}

            {/* Link-uri pentru utilizatori neautentificați */}
            {!isAuthenticated && (
              <>
                <Nav.Link as={NavLink} to="/signin">
                  Login
                </Nav.Link>
                <Nav.Link as={NavLink} to="/register">
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

MobileNavbar.propTypes = {
  navLinks: PropTypes.array.isRequired,
  isAuthenticated: PropTypes.bool,
  user: PropTypes.object,
  onLogout: PropTypes.func,
};

export default MobileNavbar;
