import React from "react";
import { Container, Row, Col } from "reactstrap";
import { Link, NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../slices/authSlice";
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
  const { isAuthenticated, user } = useSelector((state) => state.auth); // Accesează utilizatorul din Redux
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="header">
      {/* Top Header */}
      <div className="header__top">
        <Container>
          <Row>
            <Col lg="6" md="6" sm="6">
              <div className="header__top__left">
                <span>Ai nevoie de ajutor? </span>
                <span className="header__top__help">
                  <i className="ri-phone-fill"></i>
                  0740 121 689
                </span>
              </div>
            </Col>
            <Col lg="6" md="6" sm="6">
              <div className="header__top__right d-flex align-items-center justify-content-end gap-3">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="btn btn-sm btn-outline-danger"
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <Link to="/signin" className="d-flex align-items-center gap-1">
                      <i className="ri-login-circle-line"></i> Login
                    </Link>
                    <Link to="/register" className="d-flex align-items-center gap-1">
                      <i className="ri-user-line"></i> Register
                    </Link>
                  </>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Middle Header */}
      <div className="header__middle">
        <Container>
          <Row>
            <Col lg="4" md="3" sm="4">
              <div className="logo">
                <h1>
                  <Link to="/home" className="d-flex align-items-center gap-3">
                    <i className="ri-car-line"></i>
                    <span>
                      Piese Auto <br /> America
                    </span>
                  </Link>
                </h1>
              </div>
            </Col>
            <Col lg="3" md="3" sm="4">
              <div className="header__location d-flex align-items-center gap-2">
                <span>
                  <i className="ri-map-pin-line"></i>
                </span>
                <div className="header__location-content">
                  <h4>Bucuresti</h4>
                  <h6>Marasti Nr.25, Sector 1</h6>
                </div>
              </div>
            </Col>
            <Col lg="3" md="3" sm="4">
              <div className="header__location d-flex align-items-center gap-2">
                <span>
                  <i className="ri-time-line"></i>
                </span>
                <div className="header__location-content">
                  <h4>Luni - Vineri</h4>
                  <h6>09:00 - 18:00</h6>
                </div>
              </div>
            </Col>

            <Col
              lg="2"
              md="3"
              sm="0"
              className="d-flex align_items-center justify-content-end"
            >
              <button className="header__btn btn">
                <Link to="/contact">
                  <i className="ri-phone-line"></i> Ai o problema?
                </Link>
              </button>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Main nav */}
      <div className="main__navbar">
        <Container>
          <div className="navigation_wrapper d-flex align-items-center justify-content-between">
            <span className="mobile__menu">
              <i className="ri-menu-line"></i>
            </span>
            <div className="navigation">
              <div className="menu">
                {navLinks.map((item, index) => (
                  <NavLink
                    to={item.path}
                    key={index}
                    className={(navClases) =>
                      navClases.isActive
                        ? "nav__active nav__item"
                        : "nav__item"
                    }
                  >
                    {item.display}
                  </NavLink>
                ))}

                {/* Buton personalizat pentru utilizatori */}
                {!isAuthenticated ? (
                  <NavLink to="/signin" className="nav__item">
                    Comenzile mele
                  </NavLink>
                ) : user?.role === "client" ? (
                  <NavLink to="/my-orders" className="nav__item">
                    Comenzile mele
                  </NavLink>
                ) : user?.role === "admin" ? (
                  <NavLink to="/all-orders" className="nav__item">
                    Comenzi clienti
                  </NavLink>
                ) : null}

                {/* Buton pentru "Contul meu" */}
                {isAuthenticated && (
                  <NavLink to="/my-profile" className="nav__item">
                    Contul meu
                  </NavLink>
                )}
              </div>
            </div>

            <div className="nav__right">
              <div className="search__box">
                <input type="text" placeholder="Search" />
                <span>
                  <i className="ri-search-line"></i>
                </span>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </header>
  );
};

export default Header;
