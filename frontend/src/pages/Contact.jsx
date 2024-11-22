import React, { useState } from "react";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button } from "reactstrap";
import { Link } from "react-router-dom";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Simulăm trimiterea mesajului
    setTimeout(() => {
      setMessage("Mesajul a fost trimis cu succes!");
      setLoading(false);
      setFormData({
        name: "",
        email: "",
        message: "",
      });
    }, 2000); // Simulare întârziere de trimitere
  };

  return (
    <div>
      <Container className="py-5">
        <h2 className="text-center mb-4">Contactează-ne</h2>
        <Row>
          <Col md="6" className="mb-4">
            <h4>Detalii contact</h4>
            <p>
              Dacă ai întrebări sau ai nevoie de informații suplimentare, nu ezita să ne contactezi.
            </p>
            <ul className="list-unstyled">
              <li><strong>Adresă:</strong> București, Bd. Mărăști 25, Sector 1</li>
              <li><strong>Telefon:</strong> <a href="tel:0740121689">0740 121 689</a></li>
              <li>
                <strong>Email:</strong>{" "}
                <a href="mailto:costel.barbu@artri.ro" className="text-decoration-none">
                  costel.barbu@artri.ro
                </a>
              </li>
              <li><strong>Program:</strong> Luni - Vineri, 09:00 - 17:00</li>
            </ul>
          </Col>
          <Col md="6">
            <h4>Trimite-ne un mesaj</h4>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label for="name">Numele tău</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="message">Mesajul tău</Label>
                <Input
                  type="textarea"
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <Button type="submit" color="primary" disabled={loading}>
                {loading ? "Se trimite..." : "Trimite mesajul"}
              </Button>
            </Form>
            {message && <div className="alert alert-success mt-3">{message}</div>}
          </Col>
        </Row>
      </Container>

      {/* Footer cu informațiile preluate din footerul existent */}
      <footer className="bg-dark text-light py-5">
        <Container>
          <Row>
            <Col lg="4" md="6" className="mb-4">
              <div className="text-center text-md-start">
                <h1 className="text-uppercase text-white">
                  <Link to="/home" className="text-decoration-none text-white d-flex align-items-center gap-3">
                    <i className="ri-car-line"></i>
                    Piese Auto <br /> America
                  </Link>
                </h1>
                <p className="mt-3">
                  Piese auto America este un magazin online de piese auto importate din America.
                  Oferim produse de cea mai bună calitate, livrate în cel mai scurt timp posibil.
                </p>
              </div>
            </Col>

            <Col lg="2" md="3" className="mb-4">
              <h5 className="text-uppercase mb-3">Quick Links</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link to="/home" className="text-light text-decoration-none">Home</Link>
                </li>
                <li className="mb-2">
                  <Link to="/about" className="text-light text-decoration-none">About</Link>
                </li>
                <li className="mb-2">
                  <Link to="/contact" className="text-light text-decoration-none">Contact</Link>
                </li>
              </ul>
            </Col>

            <Col lg="3" md="6" className="mb-4">
              <h5 className="text-uppercase mb-3">Sediu central</h5>
              <ul className="list-unstyled">
                <li className="mb-2">București, Bd. Mărăști 25, Sector 1</li>
                <li className="mb-2">Telefon: 0740 121 689</li>
                <li className="mb-2">
                  Email:{" "}
                  <a href="mailto:costel.barbu@artri.ro" className="text-light text-decoration-none">
                    costel.barbu@artri.ro
                  </a>
                </li>
                <li>Program: Luni - Vineri 09:00 - 17:00</li>
              </ul>
            </Col>

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

          <Row className="mt-4">
            <Col>
              <p className="text-center m-0">
                <i className="ri-copyright-line"></i> Copyright {new Date().getFullYear()}, Piese Auto America. Toate drepturile rezervate.
              </p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default Contact;
