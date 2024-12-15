// eslint-disable-next-line no-unused-vars
import React from "react";
import Helmet from "../components/Helmet/Helmet";
import { Carousel, Button, Row, Col, Container } from "react-bootstrap";
import slider1 from "../assets/all-images/slider-img/BannerCarParts1.png";
import slider2 from "../assets/all-images/slider-img/slider-2.jpg";
import slider21 from "../assets/all-images/slider-img/slider-2(1).jpg";
import slider3 from "../assets/all-images/slider-img/slider-3(1).jpg";
import engineImg from "../assets/all-images/home-images/engine.jpg";
import brakingImg from "../assets/all-images/home-images/Braking.jpg";
import electricalImg from "../assets/all-images/home-images/electricals.jpg";
import homeimg from "../assets/all-images/home-images/homeimg.jpg";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <Helmet title="Home">
      {/* Hero Section */}
      <section className="p-0 hero__slider-section">
      <Carousel>
        <Carousel.Item>
          <Link to="/request-order">
            <img
              className="d-block w-100"
              src={slider1}
              alt="First slide"
              style={{ maxHeight: "600px", objectFit: "cover", cursor: "pointer" }}
            />
          </Link>
        </Carousel.Item>
        
        <Carousel.Item>
          <Link to="/request-order">
            <img
              className="d-block w-100"
              src={slider21}
              alt="Second slide"
              style={{ maxHeight: "600px", objectFit: "cover", cursor: "pointer" }}
            />
          </Link>
          <Carousel.Caption>
            <h3>Calitate superioară</h3>
            <p>Produse testate și garantate.</p>
          </Carousel.Caption>
        </Carousel.Item>
        
        <Carousel.Item>
          <Link to="/request-order">
            <img
              className="d-block w-100"
              src={slider3}
              alt="Third slide"
              style={{ maxHeight: "600px", objectFit: "cover", cursor: "pointer" }}
            />
          </Link>
          <Carousel.Caption>
            <h3>Livrare rapidă</h3>
            <p>Piese auto importate din SUA la ușa ta.</p>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>

      </section>

      {/* About Us Section */}
      <Container className="my-5">
        <Row>
          <Col md={6}>
            <h2>Despre Noi</h2>
            <p>
              Piese Auto America este un magazin online specializat în piese auto importate din
              Statele Unite. Oferim produse de înaltă calitate și livrăm rapid direct la ușa ta.
            </p>
            <p>
              Echipa noastră lucrează constant pentru a oferi cele mai bune soluții clienților noștri,
              asigurându-ne că fiecare comandă ajunge la timp și în condiții excelente.
            </p>
          </Col>
          <Col md={6}>
            <img
              src={homeimg}
              alt="About Us"
              className="img-fluid rounded"
            />
          </Col>
        </Row>
      </Container>

      {/* Popular Categories */}
      <Container className="my-5">
        <h2 className="text-center mb-4">Categoriile Noastre Populare</h2>
        <Row>
          <Col md={4}>
            <div className="category-box">
              <img
                src={engineImg}
                alt="Category 1"
                className="img-fluid"
              />
              <h4>Componente Motor</h4>
            </div>
          </Col>
          <Col md={4}>
            <div className="category-box">
              <img
                src={brakingImg}
                alt="Category 2"
                className="img-fluid"
              />
              <h4>Sisteme de Frânare</h4>
            </div>
          </Col>
          <Col md={4}>
            <div className="category-box">
              <img
                src={electricalImg}
                alt="Category 3"
                className="img-fluid"
              />
              <h4>Electrice</h4>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Call To Action */}
      <section className="cta-section text-center bg-primary text-light py-4">
        <h3>Vrei să găsești piesele potrivite pentru mașina ta?</h3>
        <p>Explorează oferta noastră și cere o ofertă acum!</p>
        <Button href="/request-order" variant="light">
          Cere Oferte
        </Button>
      </section>
    </Helmet>
  );
};

export default Home;
