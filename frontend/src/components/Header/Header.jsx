import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout, checkAuth } from "../../slices/authSlice";
import { Link, NavLink } from "react-router-dom";
import {
  Navbar,
  Nav,
  Container,
  Button,
  Form,
  FormControl,
  Row,
  Col,
} from "react-bootstrap";
import "../../styles/Header.css";

const navLinks = [
  { path: "/home", display: "Home" },
  { path: "/contact", display: "Contact" },
  { path: "/request-order", display: "Cere ofertă" },
];

const Header = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, authChecked } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!authChecked) {
      dispatch(checkAuth());
    }
  }, [dispatch, authChecked]);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header>
      {/* Top Header */}
      <div className="bg-dark text-white py-2">
        <Container>
          <Row className="align-items-center">
            <Col xs={12} md={6}>
              <span>Ai nevoie de ajutor? </span>
              <span className="fw-bold">
                <i className="ri-phone-fill"></i> 0740 121 689
              </span>
            </Col>
            <Col xs={12} md={6} className="text-md-end">
              {isAuthenticated ? (
                <>
                  <span className="me-3">
                    Salut, {user?.role === "admin" ? "Admin" : user?.email}!
                  </span>
                  <Button
                    onClick={handleLogout}
                    variant="outline-light"
                    size="sm"
                  >
                    Logout
                  </Button>
                </>
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
            </Col>
          </Row>
        </Container>
      </div>

      {/* Middle Header */}
      <div className="py-3 border-bottom bg-light">
        <Container>
          <Row className="align-items-center">
            <Col lg={4} md={4}>
              <h1 className="m-0">
                <Link to="/home" className="text-dark text-decoration-none">
                  <i className="ri-car-line me-2"></i>
                  <span className="fw-bold">Piese Auto America</span>
                </Link>
              </h1>
            </Col>
            <Col lg={4} md={4} className="text-center d-none d-lg-block">
              <div>
                <i className="ri-map-pin-line me-1"></i>
                București, Bd. Marasti Nr.25, Sector 1
              </div>
              <div>
                <i className="ri-time-line me-1"></i>
                Luni - Vineri, 09:00 - 18:00
              </div>
            </Col>
            <Col lg={4} md={4} className="text-end">
              <Link to="/contact" className="btn btn-primary">
                <i className="ri-phone-line me-1"></i> Te pot ajuta?
              </Link>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Main Navbar */}
      <Navbar bg="white" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {navLinks.map((item, index) => (
                <Nav.Link
                  key={index}
                  as={NavLink}
                  to={item.path}
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  {item.display}
                </Nav.Link>
              ))}

              {/* Linkuri speciale pentru utilizatori autentificați */}
              {isAuthenticated && user?.role === "client" && (
                <Nav.Link as={NavLink} to="/my-orders">
                  Cererile mele de oferte
                </Nav.Link>
              )}
              {isAuthenticated && user?.role === "admin" && (
                <>
                  <Nav.Link as={NavLink} to="/all-orders">
                    Cereri Oferte
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/offer-management">
                    Management Oferte
                  </Nav.Link>
                </>
              )}
              {isAuthenticated && (
                <Nav.Link as={NavLink} to="/my-profile">
                  Contul meu
                </Nav.Link>
              )}
            </Nav>
            <Form className="d-flex">
              <FormControl
                type="search"
                placeholder="Search"
                className="me-2"
                size="sm"
              />
              <Button variant="outline-secondary" size="sm">
                <i className="ri-search-line"></i>
              </Button>
            </Form>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
