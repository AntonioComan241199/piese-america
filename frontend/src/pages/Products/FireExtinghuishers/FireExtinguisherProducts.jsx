import React, { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Card, Button, Form, Spinner, Alert } from "react-bootstrap";
import { Helmet, HelmetProvider } from "react-helmet-async";
import FireExtinguisherModal from "../../../components/FireExtinguisherModal";
import "../../../styles/FireExtinguishers.css";

const API_URL = import.meta.env.VITE_API_URL;

const FireExtinguishersProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 12;

  const types = useMemo(() => [
    "Stingatoare cu CO2",
    "Stingatoare cu pulbere",
    "Stingatoare cu spuma mecanica",
    "Altele"
  ], []);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/fire-extinguishers`);
        if (!response.ok) throw new Error("Eroare la încărcarea datelor.");
        const data = await response.json();

        console.log("🔹 Stingătoare primite din API:", data);

        const validProducts = data.filter(
          (product) => product["Title"] && product["Image Src"] && product["Variant Price"]
        );

        setProducts(validProducts);
        setFilteredProducts(validProducts);
      } catch (error) {
        console.error("Eroare la încărcarea stingătoarelor:", error.message);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleFilter = useMemo(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product["Title"].toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType) {
      if (selectedType === "Altele") {
        filtered = filtered.filter(
          (product) => !types.slice(0, -1).includes(product["Type"])
        );
      } else {
        filtered = filtered.filter(
          (product) => product["Type"] === selectedType
        );
      }
    }

    return filtered;
  }, [products, searchQuery, selectedType, types]);

  useEffect(() => {
    setFilteredProducts(handleFilter);
    setCurrentPage(1);
  }, [handleFilter]);

  const handleReset = () => {
    setSearchQuery("");
    setSelectedType("");
    setFilteredProducts(products);
    setCurrentPage(1);
  };

  const totalPages = useMemo(() =>
    Math.ceil(filteredProducts.length / itemsPerPage),
    [filteredProducts.length, itemsPerPage]
  );

  const getCurrentPageProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredProducts, itemsPerPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    return imagePath.startsWith("/uploads/")
      ? `${API_URL.replace("/api", "")}${imagePath}`
      : imagePath;
  };

  const renderPagination = useMemo(() => {
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
  }, [currentPage, totalPages]);

  const ProductCard = useMemo(() => ({ product }) => (
    <Card className="h-100 shadow-sm product-card">
      <Card.Img
        loading="lazy"
        variant="top"
        src={getImageUrl(product["Image Src"])}
        alt={product["Title"] || "Imagine Stingător"}
        style={{ objectFit: "contain", height: "200px" }}
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title style={{ wordWrap: "break-word", whiteSpace: "normal" }}>
          {product["Title"] || "Stingător fără titlu"}
        </Card.Title>
        <Card.Text>
          <small className="text-muted">
            Tip: <strong>{product["Type"] || "Nespecificat"}</strong>
          </small>
          <br />
          <small className="text-muted">
            Capacitate: <strong>{product["Option1 Value"] || "Nespecificat"}</strong>
          </small>
          <br />
          <strong className="text-muted">
            Preț: <strong>{product["Variant Price"] || "Nespecificat"}</strong> RON
          </strong>
        </Card.Text>
        <Button
          variant="primary"
          className="mt-auto"
          onClick={() => {
            setSelectedProduct(product);
            setShowModal(true);
          }}
        >
          Detalii
        </Button>
      </Card.Body>
    </Card>
  ), []);

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          A apărut o eroare: {error}
        </Alert>
      </Container>
    );
  }

  return (
    <HelmetProvider>
      <Container className="py-5">
        <Helmet>
          <title>Stingătoare Auto - Piese Auto</title>
          <meta
            name="description"
            content="Catalogul nostru de stingătoare auto de calitate superioară pentru siguranța dumneavoastră."
          />
        </Helmet>

        <h1 className="text-center mb-4">Stingătoare Auto</h1>

        <Row className="mb-4">
          <Col md={5}>
            <Form.Control
              type="text"
              placeholder="Caută stingătoare după titlu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2 mb-md-0"
            />
          </Col>
          <Col md={5}>
            <Form.Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mb-2 mb-md-0"
            >
              <option value="">Toate tipurile</option>
              {types.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Button
              variant="secondary"
              onClick={handleReset}
              className="w-100"
            >
              Resetează
            </Button>
          </Col>
        </Row>

        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Se încarcă...</span>
            </Spinner>
          </div>
        ) : getCurrentPageProducts.length === 0 ? (
          <p className="text-center">Nu există stingătoare disponibile.</p>
        ) : (
          <Row>
            {getCurrentPageProducts.map((product, index) => (
              <Col key={index} lg={4} md={6} sm={12} className="mb-4">
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}

        {!isLoading && getCurrentPageProducts.length > 0 && renderPagination}

        <FireExtinguisherModal
          show={showModal}
          handleClose={() => {
            setShowModal(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          clearSelectedProduct={() => setSelectedProduct(null)}
        />
      </Container>
    </HelmetProvider>
  );
};

export default FireExtinguishersProducts;