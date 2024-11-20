import React from "react";
import Helmet from "../components/Helmet/Helmet";
import { Carousel } from "react-bootstrap";
import slider1 from "../assets/all-images/slider-img/BannerCarParts1.png";
import slider2 from "../assets/all-images/slider-img/slider-2.jpg";
import slider3 from "../assets/all-images/slider-img/slider-3.jpg";

const Home = () => {
  return (
    <Helmet title="Home">
      <section className="p-0 hero__slider-section">
        <Carousel>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={slider1}
              alt="First slide"
              style={{ maxHeight: "600px", objectFit: "cover" }}
            />
            <Carousel.Caption>
              <h3>Găsește piesele perfecte pentru mașina ta</h3>
              <p>Importăm direct din America, rapid și fiabil.</p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={slider2}
              alt="Second slide"
              style={{ maxHeight: "600px", objectFit: "cover" }}
            />
            <Carousel.Caption>
              <h3>Calitate superioară</h3>
              <p>Produse testate și garantate.</p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={slider3}
              alt="Third slide"
              style={{ maxHeight: "600px", objectFit: "cover" }}
            />
            <Carousel.Caption>
              <h3>Livrare rapidă</h3>
              <p>Piese auto importate din SUA la ușa ta.</p>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </section>
    </Helmet>
  );
};

export default Home;
