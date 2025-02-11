import React from "react";
import { Modal, Button, Image, Row, Col } from "react-bootstrap";
import { Helmet } from "react-helmet-async";

const API_URL = import.meta.env.VITE_API_URL;

const FireExtinguisherModal = ({ show, handleClose, product, clearSelectedProduct }) => {
  if (!product) return null;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    return imagePath.startsWith("/uploads/")
      ? `${API_URL.replace("/api", "")}${imagePath}`
      : imagePath;
  };

  // Funcție pentru a formata descrierea în HTML
  const formatDescription = (description) => {
    if (!description) return "";
    
    // Împărțim textul în secțiuni bazate pe titluri
    const sections = description.split(/(?=CARACTERISTICI TEHNICE|DESTINATIA PRODUSULUI|COMPONENTA|GARANTII)/g);
    
    return sections.map((section, index) => {
      if (section.trim() === "") return null;
      
      // Extragem titlul și conținutul
      const [title, ...content] = section.split("–");
      
      // Formatăm conținutul ca listă dacă există puncte
      const formattedContent = content.join("–").split("–").map(item => 
        item.trim()
      ).filter(item => item);

      return (
        <div key={index} className="mb-4">
          <h6 className="fw-bold">{title.trim()}</h6>
          <ul className="list-unstyled">
            {formattedContent.map((item, i) => (
              <li key={i} className="mb-1">• {item}</li>
            ))}
          </ul>
        </div>
      );
    });
  };

  return (
    <Modal
      show={show}
      onHide={() => {
        handleClose();
        clearSelectedProduct();
      }}
      centered
      size="lg"
    >
      <Helmet>
        <title>{product["Title"]}</title>
        <meta name="description" content={product["Description"] || ""} />
      </Helmet>
      <Modal.Header closeButton>
        <Modal.Title>{product["Title"]}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <strong>Tip:</strong> {product?.["Type"] || "Nespecificat"}
            </div>

            <div className="mb-3">
              <strong>Capacitate:</strong> {product?.["Option1 Value"] || "Nespecificat"}
            </div>

            <div className="mb-3">
              <strong>Preț:</strong>{" "}
              {product?.["Variant Price"]
                ? `${product["Variant Price"]} RON`
                : "Nespecificat"}
            </div>

            {product?.["Usage"] && (
              <div className="mb-3">
                <strong>Mod de utilizare:</strong>{" "}
                {product["Usage"]}
              </div>
            )}
          </Col>
          <Col md={6} className="text-center mb-3">
            {product?.["Image Src"] ? (
              <Image
                src={getImageUrl(product["Image Src"])}
                alt={product["Title"]}
                fluid
                style={{ maxHeight: "300px" }}
              />
            ) : (
              <p>Imagine indisponibilă</p>
            )}
          </Col>
        </Row>

        <div className="description-section mt-4">
          <h5 className="mb-3">Descriere:</h5>
          <div className="description-content">
            {formatDescription(product["Description"])}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => {
            handleClose();
            clearSelectedProduct();
          }}
        >
          Închide
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FireExtinguisherModal;