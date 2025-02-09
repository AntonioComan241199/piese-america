import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import { Helmet, HelmetProvider } from "react-helmet-async";
import OilProductModal from "../components/OilProductModal";
import "../styles/OilProducts.css";

const API_URL = import.meta.env.VITE_API_URL;

const OilProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Paginare
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Căutare
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/oil-products`);
        if (!response.ok) throw new Error("Eroare la încărcarea datelor.");
        const data = await response.json();

        console.log("🔹 Produse primite din API:", data);

        const validProducts = data.filter(
          (product) => product["Title"] && product["Image Src"] && product["Variant Price"]
        );

        setProducts(validProducts);
        setFilteredProducts(validProducts);
      } catch (error) {
        console.error("Eroare la încărcarea produselor:", error.message);
      }
    };

    fetchProducts();
  }, []);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleFilter = () => {
    const query = searchQuery.toLowerCase();
    const filtered = products.filter((product) =>
      product["Title"].toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchQuery("");
    setFilteredProducts(products);
    setCurrentPage(1);
  };

  const getCurrentPageProducts = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getImageUrl = (imagePath) => {
    console.log("🔹 Verificare imagine:", imagePath);
    if (!imagePath) return "";
    return imagePath.startsWith("/uploads/")
      ? `${API_URL.replace("/api", "")}${imagePath}`
      : imagePath;
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <button
            key={i}
            className={`pagination-button ${i === currentPage ? "active" : ""}`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      }
    } else {
      pages.push(
        <button
          key={1}
          className={`pagination-button ${currentPage === 1 ? "active" : ""}`}
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );

      if (currentPage > 3) {
        pages.push(<span key="start-ellipsis" className="pagination-ellipsis">...</span>);
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <button
            key={i}
            className={`pagination-button ${i === currentPage ? "active" : ""}`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      }

      if (currentPage < totalPages - 2) {
        pages.push(<span key="end-ellipsis" className="pagination-ellipsis">...</span>);
      }

      pages.push(
        <button
          key={totalPages}
          className={`pagination-button ${currentPage === totalPages ? "active" : ""}`}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="pagination-container">
        <button
          className="pagination-button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          &lt;
        </button>
        {pages}
        <button
          className="pagination-button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          &gt;
        </button>
      </div>
    );
  };

  const handleShowDetails = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  return (
    <HelmetProvider>
      <Container className="py-5">
        <Helmet>
          <title>Produse Uleiuri - Piese Auto</title>
          <meta name="description" content="Catalogul nostru de uleiuri de calitate superioară pentru diverse aplicații auto." />
        </Helmet>

        <h1 className="text-center mb-4">Uleiuri și Lubrifianți Auto</h1>

        <Form.Group className="mb-4 d-flex">
          <Form.Control
            type="text"
            placeholder="Caută produse după titlu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="me-2"
          />
          <Button variant="primary" onClick={handleFilter} className="me-2">Filtrează</Button>
          <Button variant="secondary" onClick={handleReset}>Resetează</Button>
        </Form.Group>

        {getCurrentPageProducts().length === 0 ? (
          <p className="text-center">Nu există produse disponibile.</p>
        ) : (
          <Row>
            {getCurrentPageProducts().map((product, index) => (
              <Col key={index} lg={4} md={6} sm={12} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Img
                    variant="top"
                    src={getImageUrl(product["Image Src"] || product["Variant Image"])}
                    alt={product["Title"] || "Imagine Produs"}
                    style={{ objectFit: "contain", height: "200px" }}
                  />
                  <Card.Body className="d-flex flex-column">
                  <Card.Title style={{ wordWrap: "break-word", whiteSpace: "normal" }}>
                    {product["Title"] || "Produs fără titlu"}
                  </Card.Title>
                    <Card.Text>
                      <small className="text-muted">
                        Tip: <strong>{product["Type"] || "Nespecificat"}</strong>
                      </small>
                      <br />
                      <small className="text-muted">
                        Ambalaj: <strong>{product["Option1 Value"] || "Nespecificat"}</strong>
                      </small>
                      <br />
                      <strong className="text-muted">
                        Preț: <strong>{product["Variant Price"] || "Nespecificat"}</strong> RON
                      </strong>
                    </Card.Text>
                    <Button variant="primary" className="mt-auto" onClick={() => handleShowDetails(product)}>
                      Detalii
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {renderPagination()}

        <OilProductModal
          show={showModal}
          handleClose={() => setShowModal(false)}
          product={selectedProduct}
          clearSelectedProduct={() => setSelectedProduct(null)}
        />
      </Container>
    </HelmetProvider>
  );
};

export default OilProducts;
