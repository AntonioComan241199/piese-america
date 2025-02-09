import React from "react";
import { Modal, Button, Image, Row, Col } from "react-bootstrap";
import { Helmet } from "react-helmet-async";

const API_URL = import.meta.env.VITE_API_URL;

const OilProductModal = ({ show, handleClose, product, clearSelectedProduct }) => {
  if (!product) return null;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return ""; // Dacă nu există imagine, returnează un string gol
    return imagePath.startsWith("/uploads/")
      ? `${API_URL.replace("/api", "")}${imagePath}` // Eliminăm `/api` doar pentru imagini locale
      : imagePath;
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
        <title>{product["SEO Title"] || product["Title"]}</title>
        <meta name="description" content={product["SEO Description"] || ""} />
      </Helmet>
      <Modal.Header closeButton>
        <Modal.Title>{product["SEO Title"] || product["Title"]}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
      <div className="modal-body-content mb-3">
        {product?.["Body (HTML)"]?.match(/<\/?[a-z][\s\S]*>/i) ? (
            // Dacă există HTML, folosim `dangerouslySetInnerHTML`
            <div dangerouslySetInnerHTML={{ __html: product["Body (HTML)"] }} />
        ) : (
            // Dacă este doar text simplu, păstrăm alinierea și rândurile noi
            <p style={{ whiteSpace: "pre-line" }}>{product["Body (HTML)"]}</p>
        )}
        </div>

        <Row>
          <Col md={6}>
            <p>
              <strong>Tip:</strong> {product?.["Type"] || "Nespecificat"}
            </p>
            <p>
              <strong>Ambalaj:</strong> {product?.["Option1 Value"] || "Nespecificat"}
            </p>
            <p>
              <strong>Preț:</strong>{" "}
              {product?.["Variant Price"]
                ? `${parseFloat(product["Variant Price"]).toFixed(2)} RON`
                : "Nespecificat"}
            </p>
            <p>
              <strong>Utilizare:</strong>{" "}
              {product?.["Utilizare"] || "Nespecificat"}
            </p>
          </Col>
          <Col md={6} className="text-center">
            {product?.["Variant Image"] || product?.["Image Src"] ? (
              <Image
                src={getImageUrl(product["Variant Image"] || product["Image Src"])}
                alt={product["Title"]}
                fluid
                style={{ maxHeight: "200px" }}
              />
            ) : (
              <p>Imagine indisponibilă</p>
            )}
          </Col>
        </Row>
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

export default OilProductModal;
