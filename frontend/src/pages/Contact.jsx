import React, { useState } from "react";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button } from "reactstrap";
import { Link } from "react-router-dom";
import Helmet from "../components/Helmet/Helmet";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";


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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
  
    try {
      const response = await fetch(`${API_URL}//contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setMessage("Mesajul a fost trimis cu succes!");
      } else {
        setMessage(data.message || "Eroare la trimiterea mesajului.");
      }
  
      setLoading(false);
      setFormData({
        name: "",
        email: "",
        message: "",
      });
    } catch (err) {
      console.error("Eroare:", err);
      setMessage("Eroare la trimiterea mesajului.");
      setLoading(false);
    }
  };
  

  return (
    <Helmet title="Contact">
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
              <li>
                <strong>Email secundar:</strong>{" "}
                <a href="mailto:automed.piese@gmail.com" className="text-decoration-none">
                  automed.piese@gmail.com
                </a>
              </li>
              <li><strong>Program:</strong> Luni - Vineri, 08:00 - 16:30</li>
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
    </div>
    </Helmet>
  );
};

export default Contact;
