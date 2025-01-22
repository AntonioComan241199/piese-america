import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const TopHeader = ({ isAuthenticated, user, onLogout }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 991);
  const sidebarWidth = 240; // Lățimea Sidebar-ului
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 991);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Secțiunea de contact și autentificare */}
      <div
        className="bg-dark text-white"
        style={{
          position: isMobile ? "relative" : "fixed",
          top: "0",
          left: "0",
          height: isMobile ? "130px" : "75px", // Înălțime diferită pe mobile
          width: "100%",
          zIndex: "1100",
        }}
      >
        <Container fluid>
          <Row
            className={`align-items-center ${
              isMobile ? "flex-column text-center py-1" : "py-4"
            } `}
          >
            <Col xs={12} md={6}>
              <span className="d-block">
                Ai nevoie de ajutor?{" "}
                <span className="fw-bold">
                  <i className="ri-phone-fill me-2"></i>
                  <a
                    href="tel:+40740121689"
                    className="text-white text-decoration-none"
                  >
                    0740 121 689
                  </a>
                </span>
              </span>
            </Col>
            <Col
              xs={12}
              md={6}
              className={`d-flex ${
                isMobile ? "flex-column text-center mt-3" : "justify-content-end"
              } gap-2`}
            >
              {isAuthenticated ? (
                <>
                  <span
                    className={`${
                      isMobile ? "d-block mb-2" : "align-self-center me-3"
                    }`}
                  >
                    Salut, {user?.email}!
                  </span>
                  <Button
                    onClick={onLogout}
                    variant="outline-light"
                    size="sm"
                    className={isMobile ? "w-50 mx-auto" : ""}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => navigate("/signin")}
                    variant="outline-light"
                    size="sm"
                    className={isMobile ? "w-50 mx-auto" : "me-2"}
                  >
                    Signin
                  </Button>
                  <Button
                    onClick={() => navigate("/register")}
                    variant="outline-light"
                    size="sm"
                    className={isMobile ? "w-50 mx-auto" : ""}
                  >
                    Register
                  </Button>
                </>
              )}
            </Col>
          </Row>
        </Container>
      </div>

      {/* Secțiunea centrală cu program și butoane */}
      <div
        className="bg-light border-bottom"
        style={{
          position: "relative",
          marginTop: isMobile ? "0px" : "75px", // Ajustăm în funcție de înălțime
          left: isMobile ? "0" : `${sidebarWidth}px`,
          width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
          zIndex: "1099",
        }}
      >
        <Container fluid>
          <Row
            className={`align-items-center ${
              isMobile ? "flex-column text-center" : ""
            } py-2`}
          >
            <Col xs={12} lg={8}>
              <div className="d-block">
                <i className="ri-map-pin-line me-2"></i>
                București, Bd. Mărăști Nr.25, Sector 1
              </div>
              <div className="d-block">
                <i className="ri-time-line me-2"></i>
                Luni - Vineri, 09:00 - 18:00
              </div>
            </Col>
            <Col xs={12} lg={4} className="text-lg-end mt-3 mt-lg-0">
              <Button
                as="a"
                href="tel:+40740121689"
                className="btn btn-primary me-2 mb-2 mb-lg-0"
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
                aria-label="Scrie-ne acum pe WhatsApp"
              >
                <i className="ri-whatsapp-line me-1"></i> WhatsApp
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Mesaj de informare */}
      <div
        className="bg-warning"
        style={{
          position: "relative",
          left: isMobile ? "0" : `${sidebarWidth}px`,
          width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
          zIndex: "1098",
        }}
      >
        <Container>
          <p
            className={`text-center m-0 text-dark fs-6 ${
              isMobile ? "py-3" : "py-2"
            }`}
          >
            <i className="ri-information-line me-1"></i>
            Acest site este destinat solicitării ofertelor pentru piese auto. Nu
            avem un catalog de produse, dar suntem aici să te ajutăm!
          </p>
        </Container>
      </div>
    </>
  );
};

export default TopHeader;
