import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Spinner,
  Alert
} from "react-bootstrap";

const API_URL = import.meta.env.VITE_API_URL;

const FireExtinguisherModal = ({ show, handleClose, product, onSave }) => {
  const [formData, setFormData] = useState({
    Title: "",
    Type: "",
    CustomType: "",
    "Image Src": "",
    Description: "",
    "Option1 Value": "",
    "Variant Price": "",
    Usage: ""
  });

  const predefinedTypes = [
    "Stingatoare cu CO2",
    "Stingatoare cu pulbere",
    "Stingatoare cu spuma mecanica",
    "Altele"
  ];

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        Type: predefinedTypes.includes(product.Type) ? product.Type : "Altele",
        CustomType: predefinedTypes.includes(product.Type) ? "" : product.Type
      });
    } else {
      setFormData({
        Title: "",
        Type: "",
        CustomType: "",
        "Image Src": "",
        Description: "",
        "Option1 Value": "",
        "Variant Price": "",
        Usage: ""
      });
    }
  }, [product]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Asigurați-vă că valoarea este curățată de spații multiple și la început/sfârșit
    const cleanedValue = value.trim().replace(/\s+/g, ' ');
    
    setFormData(prev => ({
      ...prev,
      [name]: cleanedValue
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_URL}/fire-extinguishers/upload`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Eroare la încărcarea imaginii");
      }

      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        "Image Src": data.imageUrl
      }));
    } catch (error) {
      console.error("Eroare la încărcarea imaginii:", error);
      alert("Eroare la încărcarea imaginii: " + error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalFormData = {
      ...formData,
      Type: formData.Type === "Altele" ? formData.CustomType : formData.Type
    };
    delete finalFormData.CustomType;
    onSave(finalFormData);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {product ? "Editare Stingător" : "Adăugare Stingător"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Titlu</Form.Label>
            <Form.Control
              type="text"
              name="Title"
              value={formData.Title}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tip</Form.Label>
            <Form.Select
              name="Type"
              value={formData.Type}
              onChange={handleInputChange}
              required
            >
              <option value="">Selectează tipul</option>
              {predefinedTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {formData.Type === "Altele" && (
            <Form.Group className="mb-3">
              <Form.Label>Specificați tipul</Form.Label>
              <Form.Control
                type="text"
                name="CustomType"
                value={formData.CustomType}
                onChange={handleInputChange}
                required
                placeholder="Introduceți tipul personalizat"
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Imagine</Form.Label>
            <Form.Control
              type="file"
              onChange={handleImageUpload}
              accept="image/*"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Descriere</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              name="Description"
              value={formData.Description}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Capacitate</Form.Label>
            <Form.Control
              type="text"
              name="Option1 Value"
              value={formData["Option1 Value"]}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Preț</Form.Label>
            <Form.Control
              type="number"
              name="Variant Price"
              value={formData["Variant Price"]}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mod de utilizare</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="Usage"
              value={formData.Usage}
              onChange={handleInputChange}
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Anulează
            </Button>
            <Button variant="primary" type="submit">
              Salvează
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

const AdminFireExtinguishers = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/fire-extinguishers`);
      if (!response.ok) throw new Error("Eroare la încărcarea datelor");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      setError(error.message);
      console.error("Eroare:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Sigur doriți să ștergeți acest produs?")) return;
  
    try {
      const response = await fetch(
        `${API_URL}/fire-extinguishers/${productId}`,
        {
          method: "DELETE"
        }
      );
  
      if (!response.ok) throw new Error("Eroare la ștergerea produsului");
  
      await fetchProducts();
    } catch (error) {
      console.error("Eroare la ștergere:", error);
      alert("Eroare la ștergerea produsului: " + error.message);
    }
  };
  
  

  const handleSaveProduct = async (formData) => {
    try {
      const method = selectedProduct ? "PUT" : "POST";
      const url = selectedProduct
        ? `${API_URL}/fire-extinguishers/${selectedProduct._id}`
        : `${API_URL}/fire-extinguishers`;
  
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Eroare la salvarea produsului");
      }
  
      await fetchProducts();
    } catch (error) {
      console.error("Eroare la salvare:", error);
      alert("Eroare la salvarea produsului: " + error.message);
    }
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Administrare Stingătoare Auto</h1>
        <Button variant="primary" onClick={handleAddProduct}>
          Adaugă Stingător
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Se încarcă...</span>
          </Spinner>
        </div>
      ) : (
        <Row>
          {products.map((product) => (
            <Col key={product._id} lg={4} md={6} className="mb-4">
              <Card>
                <Card.Img
                  variant="top"
                  src={`${API_URL.replace("/api", "")}${product["Image Src"]}`}
                  alt={product.Title}
                  style={{ height: "200px", objectFit: "contain" }}
                />
                <Card.Body>
                  <Card.Title>{product.Title}</Card.Title>
                  <Card.Text>
                    <strong>Tip:</strong> {product.Type}
                    <br />
                    <strong>Capacitate:</strong> {product["Option1 Value"]}
                    <br />
                    <strong>Preț:</strong> {product["Variant Price"]} RON
                  </Card.Text>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      onClick={() => handleEditProduct(product)}
                    >
                      Editează
                    </Button>
                    <Button
                      variant="outline-danger"
                      onClick={() => handleDeleteProduct(product._id)}
                    >
                      Șterge
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <FireExtinguisherModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        product={selectedProduct}
        onSave={handleSaveProduct}
      />
    </Container>
  );
};

export default AdminFireExtinguishers;