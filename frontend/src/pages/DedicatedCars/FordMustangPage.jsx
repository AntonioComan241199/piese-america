import React from "react";
import Helmet from "../../components/Helmet/Helmet";
import { Container, Row, Col, Button } from "react-bootstrap";

const FordMustangPage = () => {
  return (
    <Helmet title="Piese Auto Ford Mustang - Import SUA | PieseAutoAmerica.ro">
      <meta
        name="description"
        content="Comandă piese auto originale și aftermarket pentru Ford Mustang. Import direct din SUA, livrare rapidă în toată România. Cere ofertă personalizată!"
      />

      <Container className="my-5">
        <Row>
          <Col md={6}>
            <h1>Piese Auto Ford Mustang</h1>
            <p>
              Cauți <strong>piese auto originale sau aftermarket pentru Ford Mustang</strong>? Ești în locul potrivit. La <strong>Piese Auto America</strong> aducem piese importate direct din SUA pentru toate generațiile de Mustang, inclusiv GT, Ecoboost, Shelby și altele.
            </p>
            <p>
              Oferim acces rapid la <strong>piese de motor, transmisie, suspensie, caroserie și electrice</strong>, toate verificate și compatibile. Dacă nu ai codul piesei, ne ocupăm noi de identificare!
            </p>
            <Button href="/request-order?model=mustang" variant="primary">
              Cere ofertă pentru Mustang
            </Button>
          </Col>

          <Col md={6}>
            <img src='' alt="Piese auto Ford Mustang" className="img-fluid rounded" />
          </Col>
        </Row>

        <Row className="mt-5">
          <Col>
            <h2>Import direct din SUA</h2>
            <p>
              Colaborăm cu furnizori din Statele Unite pentru a aduce <strong>piese auto Ford Mustang de calitate</strong> la prețuri accesibile. Fie că ai nevoie de un filtru de ulei sau de un set complet de discuri și plăcuțe de frână, te putem ajuta.
            </p>

            <h3>Livrare rapidă în România</h3>
            <p>
              Livrăm în medie în 2-5 zile lucrătoare, oriunde în țară. Comunicăm transparent toate detaliile de livrare și ofertare.
            </p>

            <h3>Piese disponibile:</h3>
            <ul>
              <li>✅ Filtre ulei, aer, combustibil</li>
              <li>✅ Amortizoare, suspensie</li>
              <li>✅ Ambreiaje și piese de transmisie</li>
              <li>✅ Discuri și plăcuțe de frână</li>
              <li>✅ Elemente de caroserie</li>
              <li>✅ Piese electrice și senzori</li>
            </ul>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col>
            <h2>De ce să alegi Piese Auto America?</h2>
            <ul>
              <li>🔧 Identificăm piesele corecte după seria VIN</li>
              <li>🚚 Livrare rapidă, direct din SUA</li>
              <li>📦 Posibilitate de comandă fără cod piesă</li>
              <li>💬 Suport tehnic dedicat</li>
            </ul>
          </Col>
        </Row>

        <Row className="text-center mt-5">
          <Col>
            <h3>Ai nevoie de o piesă pentru Ford Mustang?</h3>
            <p>Noi o găsim pentru tine. Trimite-ne o cerere și te contactăm rapid cu oferta potrivită.</p>
            <Button href="/request-order?model=mustang" variant="success" size="lg">
              Trimite cerere de ofertă
            </Button>
          </Col>
        </Row>
      </Container>
    </Helmet>
  );
};

export default FordMustangPage;
