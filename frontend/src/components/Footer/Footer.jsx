import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

const quickLinks = [
  { path: "/home", display: "Home" },
  { path: "/contact", display: "Contact" },
  { path: "/request-order", display: "Cere ofertă" },
  { path: "/terms", display: "Termeni și Condiții" },
];

const Footer = () => {
  const year = new Date().getFullYear();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 991);

  useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 991);
      };
  
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);
  

  const handleLinkClick = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-dark text-light py-5"
    style={{
      marginLeft: isMobile ? "0" : "240px", // Se aliniază cu Sidebar
      transition: "margin-left 0.3s ease", // Tranziție lină
    }}
    >
      <Container>
        <Row className="align-items-start">
          {/* Logo și Descriere */}
          <Col lg={4} md={6} className="mb-4">
            <h5 className="text-uppercase text-white mb-3">Piese Auto America</h5>
            <p className="footer-text">
              Oferim piese auto de cea mai bună calitate, livrate rapid și eficient. Contactați-ne pentru detalii și asistență personalizată.
            </p>
            <p>
              <a
                href="https://automed.ro/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light text-decoration-none"
              >
                Fostul AutoMed.ro
              </a>
            </p>
          </Col>

          {/* Linkuri Rapide */}
          <Col lg={2} md={3} sm={6} className="mb-4">
            <h5 className="text-uppercase mb-3">Linkuri Utile</h5>
            <ul className="list-unstyled">
              {quickLinks.map((item, index) => (
                <li key={index} className="mb-2">
                  <button
                    className="btn btn-link text-light text-decoration-none p-0"
                    onClick={() => handleLinkClick(item.path)}
                  >
                    {item.display}
                  </button>
                </li>
              ))}
            </ul>
          </Col>

          {/* Sediu și Locație */}
          <Col lg={3} md={6} sm={6} className="mb-4">
            <h5 className="text-uppercase mb-3">Contact</h5>
            <ul className="list-unstyled footer-text">
              <li className="mb-2">București, Bd. Mărăști 25, Sector 1</li>
              <li className="mb-2">Telefon: 0740 121 689</li>
              <li className="mb-2">
                Email: <a href="mailto:costel.barbu@artri.ro" className="text-light">costel.barbu@artri.ro</a>
              </li>
              <li className="mb-2">
                Email secundar: <a href="mailto:automed.piese@gmail.com" className="text-light">automed.piese@gmail.com</a>
              </li>
              <li>Program: Luni - Vineri 08:00 - 16:30</li>
            </ul>
          </Col>

          {/* Harta și Social Media */}
          <Col lg={3} md={6} className="mb-4">
            <h5 className="text-uppercase mb-3">Locație și Social Media</h5>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2847.3280523795843!2d26.071459476662657!3d44.467447999388284!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b2038ae9cd8969%3A0x35844ec921fc4cea!2sPIESE%20AUTO%20AMERICA%20(Quality%20Global%20Solutions%20SRL)!5e0!3m2!1sro!2sro!4v1737336717588!5m2!1sro!2sro"
              width="100%"
              height="150"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
            <a
              href="https://www.facebook.com/pieseautoamerica?locale=ro_RO"
              target="_blank"
              rel="noopener noreferrer"
              className="text-light text-decoration-none d-flex align-items-center gap-3 mt-3"
            >
              <i className="ri-facebook-circle-line display-5 text-primary"></i>
              <span>AutoMed.ro - Pagina oficială</span>
            </a>
          </Col>
        </Row>

        {/* Drepturi de Autor */}
        <Row className="mt-4">
          <Col>
            <p className="text-center footer-text m-0">
              <i className="ri-copyright-line"></i> {year} Piese Auto America. Toate drepturile rezervate.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
