import React from "react";
import Helmet from "../components/Helmet/Helmet";
import { Carousel, Button, Row, Col, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

import slider1 from "../assets/all-images/slider-img/BannerCarParts1.png";
import slider21 from "../assets/all-images/slider-img/slider-2(1).jpg";
import slider3 from "../assets/all-images/slider-img/slider-3(1).jpg";
import engineImg from "../assets/all-images/home-images/engine.jpg";
import brakingImg from "../assets/all-images/home-images/Braking.jpg";
import electricalImg from "../assets/all-images/home-images/electricals.jpg";
import homeimg from "../assets/all-images/home-images/homeimg.jpg";

import "../styles/RequestOrder.css";

const Home = () => {
  return (
    <Helmet title="Piese Auto Americane | Import Direct SUA - Livrare Rapidă">
      <meta
        name="description"
        content="Comandă piese auto originale și aftermarket pentru Ford, Chevrolet, Dodge, Mustang, Jeep. Import direct SUA. Livrare rapidă în România."
      />

      {/* Hero Section */}
      <section className="p-0 hero__slider-section">
        <Container>
          <Carousel>
            <Carousel.Item>
              <Link to="/request-order">
                <img
                  className="d-block w-100"
                  src={slider1}
                  alt="Comandă piese auto americane originale"
                  style={{ maxHeight: "600px", objectFit: "cover", cursor: "pointer" }}
                />
              </Link>
            </Carousel.Item>
            <Carousel.Item>
              <Link to="/request-order">
                <img
                  className="d-block w-100"
                  src={slider21}
                  alt="Livrare rapidă piese auto SUA"
                  style={{ maxHeight: "600px", objectFit: "cover", cursor: "pointer" }}
                />
              </Link>
              <Carousel.Caption>
                <h3>Calitate superioară</h3>
                <p>Piese testate și garantate, direct din SUA.</p>
              </Carousel.Caption>
            </Carousel.Item>
            <Carousel.Item>
              <Link to="/request-order">
                <img
                  className="d-block w-100"
                  src={slider3}
                  alt="Piese auto Ford Chevrolet Dodge Jeep"
                  style={{ maxHeight: "600px", objectFit: "cover", cursor: "pointer" }}
                />
              </Link>
              <Carousel.Caption>
                <h3>Livrare rapidă</h3>
                <p>Import piese auto americane fără costuri ascunse.</p>
              </Carousel.Caption>
            </Carousel.Item>
          </Carousel>
        </Container>
      </section>

      {/* SEO Keyword Banner */}
      <section className="bg-light py-4 text-center">
        <Container>
          <p className="mb-0">
            Cumpără piese auto americane originale și aftermarket pentru <strong>Ford Mustang</strong>, <strong>Chevrolet Camaro</strong>, <strong>Dodge Charger</strong>, <strong>Hummer H2</strong>, <strong>Hummer H3</strong>  și alte modele. Livrare rapidă din SUA în toată România!
          </p>
        </Container>
      </section>

      {/* About Us */}
      <Container className="my-5">
        <Row>
          <Col md={6}>
            <h2>Despre Noi</h2>
            <p>
              <strong>Piese Auto America</strong> este un magazin online specializat în <strong>importul de piese auto americane originale și aftermarket</strong>, livrate rapid în toată România.
            </p>
            <p>
              Oferim piese pentru <strong>Ford, Chevrolet, Dodge, Mustang, Cadillac, Jeep</strong> și multe altele, direct din SUA. Garanția calității și suportul rapid sunt prioritățile noastre.
            </p>
            <p>
              Echipa noastră lucrează constant pentru a livra <strong>soluții rapide și eficiente</strong>, cu consultanță gratuită și fără costuri ascunse.
            </p>
          </Col>
          <Col md={6}>
            <img src={homeimg} alt="Despre Piese Auto America" className="img-fluid rounded" />
          </Col>
        </Row>
      </Container>

      {/* Popular Categories */}
      <Container className="my-5">
        <h2 className="text-center mb-4">Categoriile Noastre Populare</h2>
        <Row>
          <Col md={4}>
            <div className="category-box">
              <img src={engineImg} alt="Componente motor auto SUA" className="img-fluid" />
              <h4>Componente Motor</h4>
            </div>
          </Col>
          <Col md={4}>
            <div className="category-box">
              <img src={brakingImg} alt="Sisteme frânare auto americane" className="img-fluid" />
              <h4>Sisteme de Frânare</h4>
            </div>
          </Col>
          <Col md={4}>
            <div className="category-box">
              <img src={electricalImg} alt="Componente electrice auto SUA" className="img-fluid" />
              <h4>Electrice</h4>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Why Choose Us */}
      <Container className="my-5">
        <h2 className="text-center mb-4">De ce să alegi Piese Auto America?</h2>
        <Row>
          <Col md={4}><p>✅ Piese originale și aftermarket import SUA</p></Col>
          <Col md={4}><p>✅ Livrare rapidă în toată România</p></Col>
          <Col md={4}><p>✅ Consultanță tehnică gratuită și suport dedicat</p></Col>
        </Row>
      </Container>

      {/* FAQ Section */}
      <Container className="my-5">
        <h2 className="text-center mb-4">Întrebări frecvente</h2>
        <Row>
          <Col md={6}>
            <h5>Ce tipuri de piese pot comanda?</h5>
            <p>Poți comanda piese originale și aftermarket pentru Ford, Dodge, Chevrolet, Jeep și altele.</p>
          </Col>
          <Col md={6}>
            <h5>Pot comanda fără un cod de piesă?</h5>
            <p>Sigur! Ne trimiți detaliile mașinii (VIN sau caracteristici) și noi identificăm rapid piesa de care ai nevoie.</p>
          </Col>
          <Col md={6}>
            <h5>Pot primi ofertă personalizată?</h5>
            <p>Da. Accesează secțiunea „Cere ofertă” și completează formularul.</p>
          </Col>
        </Row>
      </Container>

      {/* Call To Action */}
      <section className="cta-section text-center bg-primary text-light py-4">
        <h3>Vrei să găsești piesele potrivite pentru mașina ta?</h3>
        <p>Cere o ofertă acum!</p>
        <Button href="/request-order" variant="light">
          Cere Oferta
        </Button>
      </section>
    </Helmet>
  );
};

export default Home;