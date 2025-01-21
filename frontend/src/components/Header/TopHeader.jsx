import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const TopHeader = ({ isAuthenticated, user, onLogout }) => {
  return (
    <>
      {/* Secțiunea de contact și autentificare */}
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
                  <span className="me-3">Salut, {user?.email}!</span>
                  <Button onClick={onLogout} variant="outline-light" size="sm">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/signin" className="text-white me-3">
                    Login
                  </Link>
                  <Link to="/register" className="text-white">
                    Register
                  </Link>
                </>
              )}
            </Col>
          </Row>
        </Container>
      </div>

      {/* Secțiunea centrală cu program și butoane */}
      <div className="py-0 border-bottom bg-light">
        <Container>
          <Row className="align-items-center">
            <Col xs={12} lg={8} className="text-center text-lg-center">
              <div>
                <i className="ri-map-pin-line me-1"></i>
                București, Bd. Mărăști Nr.25, Sector 1
              </div>
              <div>
                <i className="ri-time-line me-1"></i>
                Luni - Vineri, 09:00 - 18:00
              </div>
            </Col>
            <Col xs={12} lg={4} className="text-center text-lg-end mt-3 mt-lg-0">
              <Button
                as="a"
                href="tel:+40740121689"
                className="btn btn-primary me-2"
                aria-label="Sună acum la 0740 121 689"
              >
                <i className="ri-phone-line me-1"></i> Sună acum
              </Button>
              <Button
                as="a"
                href="https://wa.me/40740121689"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success"
                aria-label="Scrie-ne acum la 0740 121 689"
              >
                <i className="ri-whatsapp-line me-1"></i> WhatsApp
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Mesaj sugestiv */}
      <div className="bg-warning py-0">
        <Container>
          <p className="text-center m-0 text-dark fs-6">
            <i className="ri-information-line me-1"></i>
            Acest site este destinat solicitării ofertelor pentru piese auto. Nu avem un catalog de produse, dar suntem aici să te ajutăm!
          </p>
        </Container>
      </div>
    </>
  );
};

export default TopHeader;
