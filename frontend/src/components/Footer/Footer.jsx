// eslint-disable-next-line no-unused-vars
import React from "react";
import { Container, Row, Col } from "reactstrap";
import { Link } from "react-router-dom";
import "../../styles/footer.css";

const quickLinks = [
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

const Footer = () => {
  const date = new Date();
  const year = date.getFullYear();

  return (
    <footer className="bg-dark text-light py-5">
      <Container>
        <Row>
          {/* Logo și descriere */}
          <Col lg="4" md="6" className="mb-4">
            <div className="text-center text-md-start">
              <h1 className="text-uppercase text-white">
                <Link
                  to="/home"
                  className="text-decoration-none text-white d-flex align-items-center gap-3"
                >
                  <i className="ri-car-line"></i>
                  Piese Auto <br /> America
                </Link>
              </h1>
              <p className="mt-3">
                Piese auto America este un magazin online de piese auto importate
                din America. Oferim produse de cea mai bună calitate, livrate în
                cel mai scurt timp posibil.
              </p>
            </div>
          </Col>

          {/* Linkuri rapide */}
          <Col lg="2" md="3" className="mb-4">
            <h5 className="text-uppercase mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              {quickLinks.map((item, index) => (
                <li key={index} className="mb-2">
                  <Link
                    to={item.path}
                    className="text-light text-decoration-none"
                  >
                    {item.display}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          {/* Sediu central */}
          <Col lg="3" md="6" className="mb-4">
            <h5 className="text-uppercase mb-3">Sediu central</h5>
            <ul className="list-unstyled">
              <li className="mb-2">București, Bd. Mărăști 25, Sector 1</li>
              <li className="mb-2">Telefon: 0740 121 689</li>
              <li className="mb-2">
                Email:{" "}
                <a
                  href="mailto:costel.barbu@artri.ro"
                  className="text-light text-decoration-none"
                >
                  costel.barbu@artri.ro
                </a>
              </li>
              <li className="mb-2">
                Email secundar:{" "}
                <a
                  href="mailto:automed.piese@gmail.com"
                  className="text-light text-decoration-none"
                >
                  automed.piese@gmail.com
                </a>
              </li>
              <li>Program: Luni - Vineri 09:00 - 17:00</li>
            </ul>
          </Col>

          {/* Newsletter */}
          <Col lg="3" md="6" className="mb-4">
            <h5 className="text-uppercase mb-3">Newsletter</h5>
            <p>Abonați-vă la noutățile și actualizările noastre.</p>
            <div className="d-flex">
              <input
                type="email"
                placeholder="Email"
                className="form-control me-2"
              />
              <button className="btn btn-primary">
                <i className="ri-send-plane-line"></i>
              </button>
            </div>
          </Col>
        </Row>

        {/* Drepturi de autor */}
        <Row className="mt-4">
          <Col>
            <p className="text-center m-0">
              <i className="ri-copyright-line"></i> Copyright {year}, Piese Auto
              America. Toate drepturile rezervate.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
