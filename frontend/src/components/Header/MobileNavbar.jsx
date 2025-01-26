import React, { useState } from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { NavLink, Link } from "react-router-dom";
import PropTypes from "prop-types";

const MobileNavbar = ({ isAuthenticated, user, onLogout, navLinks = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false); // Stare pentru navbar

  const handleNavLinkClick = () => {
    setIsExpanded(false); // Închide meniul după selectarea unei opțiuni
    window.scrollTo({ top: 0, behavior: "smooth" }); // Mergem în partea de sus a paginii
  };

  return (
    <Navbar
      expand="lg"
      bg="dark"
      variant="dark"
      className="d-lg-none"
      expanded={isExpanded} // Controlează starea meniului
    >
      <Container>
        {/* Brand-ul site-ului */}
        <Navbar.Brand>
          <Link to="/home" className="text-white text-decoration-none">
            <i className="ri-car-line me-2"></i>Piese Auto America
          </Link>
        </Navbar.Brand>

        {/* Toggle pentru meniul mobil */}
        <Navbar.Toggle
          aria-controls="mobile-navbar"
          onClick={() => setIsExpanded((prev) => !prev)} // Toggle între deschis/închis
        >
          <i className="ri-menu-line"></i> <span className="ms-2">Meniu</span>
        </Navbar.Toggle>

        {/* Navigație în meniul mobil */}
        <Navbar.Collapse id="mobile-navbar">
          <Nav className="ms-auto">
            {/* Link-uri generale de navigare */}
            {navLinks.map((item, index) => (
              <Nav.Link
                key={index}
                as={NavLink}
                to={item.path}
                onClick={handleNavLinkClick} // Închide meniul când se dă click
                className={({ isActive }) =>
                  isActive ? "nav-link active text-primary" : "nav-link text-white"
                }
              >
                {item.display}
              </Nav.Link>
            ))}

            {/* Link-uri suplimentare pentru utilizatori autentificați */}
            {isAuthenticated && (
              <>
                {user?.role === "client" && (
                  <>
                    <Nav.Link
                      as={NavLink}
                      to="/my-orders"
                      onClick={handleNavLinkClick} // Închide meniul când se dă click
                      className={({ isActive }) =>
                        isActive
                          ? "nav-link active text-primary"
                          : "nav-link text-white"
                      }
                    >
                      Evidenta Oferte
                    </Nav.Link>
                    <Nav.Link
                      as={NavLink}
                      to="/my-offers"
                      onClick={handleNavLinkClick} // Închide meniul când se dă click
                      className={({ isActive }) =>
                        isActive
                          ? "nav-link active text-primary"
                          : "nav-link text-white"
                      }
                    >
                      Evidenta Comenzi
                    </Nav.Link>
                  </>
                )}
                {user?.role === "admin" && (
                  <>
                    <Nav.Link
                      as={NavLink}
                      to="/admin-orders"
                      onClick={handleNavLinkClick} // Închide meniul când se dă click
                      className={({ isActive }) =>
                        isActive
                          ? "nav-link active text-primary"
                          : "nav-link text-white"
                      }
                    >
                      Evidenta Oferte Admin
                    </Nav.Link>
                    <Nav.Link
                      as={NavLink}
                      to="/admin-offers"
                      onClick={handleNavLinkClick} // Închide meniul când se dă click
                      className={({ isActive }) =>
                        isActive
                          ? "nav-link active text-primary"
                          : "nav-link text-white"
                      }
                    >
                      Evidenta Comenzi Admin
                    </Nav.Link>
                  </>
                )}
                {/* Link către profilul utilizatorului */}
                <Nav.Link
                  as={NavLink}
                  to="/my-profile"
                  onClick={handleNavLinkClick} // Închide meniul când se dă click
                  className={({ isActive }) =>
                    isActive
                      ? "nav-link active text-primary"
                      : "nav-link text-white"
                  }
                >
                  Contul meu
                </Nav.Link>
                {/* Buton de Logout */}
                <Button
                  onClick={() => {
                    onLogout();
                    setIsExpanded(false); // Închide meniul după logout
                  }}
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
                <Nav.Link
                  as={NavLink}
                  to="/signin"
                  onClick={handleNavLinkClick} // Închide meniul când se dă click
                  className={({ isActive }) =>
                    isActive
                      ? "nav-link active text-primary"
                      : "nav-link text-white"
                  }
                >
                  Login
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/register"
                  onClick={handleNavLinkClick} // Închide meniul când se dă click
                  className={({ isActive }) =>
                    isActive
                      ? "nav-link active text-primary"
                      : "nav-link text-white"
                  }
                >
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
