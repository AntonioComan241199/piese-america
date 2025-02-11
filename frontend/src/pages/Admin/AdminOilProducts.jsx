import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Form,
  Modal,
  Pagination,
  Spinner
} from "react-bootstrap";

const API_URL = import.meta.env.VITE_API_URL;

const AdminOilProducts = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [customType, setCustomType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 12;

  const mainTypes = [
    "Ulei Hidraulic",
    "Ulei de motor",
    "Ulei Transmisie",
    "Ulei Servodirectie",
    "Vaselina",
    "Calendare",
    "Aditivi",
    "Spray-uri",
    "Kit Antipana"
  ];

  const types = [...mainTypes, "Altele"];

  const initialFormData = {
    Title: "",
    Type: "",
    "Image Src": "",
    "Variant Price": "",
    "Body (HTML)": "",
    "Option1 Value": "",
    "Utilizare": "",
    "Variant Image": ""
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/oil-products`);
      if (!response.ok) throw new Error("Eroare la preluarea produselor");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Eroare la fetch:", error);
      alert("Nu s-au putut încărca produsele.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.Title.trim()) errors.Title = "Titlul este obligatoriu";
    if (!formData.Type && !customType) errors.Type = "Tipul este obligatoriu";
    if (!formData["Variant Price"]) errors.Price = "Prețul este obligatoriu";
    if (!formData["Image Src"]) errors.Image = "Imaginea este obligatorie";
    return Object.keys(errors).length === 0 ? null : errors;
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      Title: product.Title || "",
      Type: product.Type || "",
      "Image Src": product["Image Src"] || "",
      "Variant Price": product["Variant Price"] || "",
      "Body (HTML)": product["Body (HTML)"] || "",
      "Option1 Value": product["Option1 Value"] || "",
      "Utilizare": product["Utilizare"] || "",
      "Variant Image": product["Variant Image"] || ""
    });
    setSelectedType(mainTypes.includes(product.Type) ? product.Type : "Altele");
    setCustomType(mainTypes.includes(product.Type) ? "" : product.Type);
    setShowModal(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setSelectedType("");
    setCustomType("");
    setShowModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert("Imaginea este prea mare. Dimensiunea maximă este 5MB.");
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert("Tip de fișier nepermis. Sunt acceptate doar JPEG și PNG.");
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    try {
      const response = await fetch(`${API_URL}/oil-products/upload`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) throw new Error("Eroare la încărcare");

      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        "Image Src": data.imageUrl,
        "Variant Image": data.imageUrl
      }));
    } catch (error) {
      console.error("Eroare la încărcarea imaginii:", error);
      alert("Nu s-a putut încărca imaginea.");
    }
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (errors) {
      alert(Object.values(errors).join("\n"));
      return;
    }

    const finalType = selectedType === "Altele" ? customType : selectedType;

    if (selectedType === "Altele" && !customType.trim()) {
      alert("Vă rugăm să introduceți un tip personalizat");
      return;
    }

    const payload = {
      ...formData,
      Type: finalType,
      "Variant Image": formData["Image Src"]
    };

    try {
      const method = editingProduct ? "PUT" : "POST";
      const url = editingProduct
        ? `${API_URL}/oil-products/${editingProduct._id}`
        : `${API_URL}/oil-products`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Eroare la salvare");

      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error("Eroare la salvare:", error);
      alert("A apărut o eroare la salvarea produsului");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Sigur doriți să ștergeți acest produs?")) return;

    try {
      const response = await fetch(`${API_URL}/oil-products/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Eroare la ștergere");
      fetchProducts();
    } catch (error) {
      console.error("Eroare la ștergere:", error);
      alert("Nu s-a putut șterge produsul.");
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    return imagePath.startsWith("/uploads/")
      ? `${API_URL.replace("/api", "")}${imagePath}`
      : imagePath;
  };

  const handleTypeChange = (e) => {
    const selected = e.target.value;
    setSelectedType(selected);

    if (selected === "Altele") {
      setCustomType("");
      setFormData(prev => ({ ...prev, Type: "" }));
    } else {
      setCustomType("");
      setFormData(prev => ({ ...prev, Type: selected }));
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const titleMatch = product.Title.toLowerCase().includes(searchQuery.toLowerCase());

      if (!selectedType) return titleMatch;

      if (selectedType === "Altele") {
        return titleMatch && !mainTypes.includes(product.Type);
      }

      return titleMatch && product.Type === selectedType;
    });
  }, [products, searchQuery, selectedType, mainTypes]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderPaginationItems = () => {
    const items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => setCurrentPage(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    return items;
  };

  return (
    <div className="container py-5">
      <h2>Admin - Gestionare Uleiuri</h2>

      <div className="mb-3 d-flex gap-2">
        <Form.Control
          type="text"
          placeholder="Caută produse..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Form.Select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="">Toate tipurile</option>
          {types.map((type, index) => (
            <option key={index} value={type}>{type}</option>
          ))}
        </Form.Select>
      </div>

      <Button variant="primary" onClick={handleAddProduct} className="mb-3">
        Adaugă Produs
      </Button>

      {isLoading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Se încarcă...</span>
          </Spinner>
        </div>
      ) : (
        <div className="row g-4">
          {displayedProducts.map((product) => (
            <div key={product._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <div className="card h-100">
                <div className="card-img-top position-relative" style={{ height: '200px' }}>
                  {product["Image Src"] ? (
                    <img
                      src={getImageUrl(product["Image Src"])}
                      alt={product.Title}
                      className="w-100 h-100 object-fit-contain p-2"
                    />
                  ) : (
                    <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                      N/A
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <h5 className="card-title" style={{ fontSize: '1rem' }}>{product.Title}</h5>
                  <p className="card-text">
                    <small className="text-muted">Tip: {product.Type}</small>
                    <br />
                    <strong>{product["Variant Price"]} RON</strong>
                  </p>
                </div>
                <div className="card-footer bg-white border-top-0">
                  <div className="d-flex gap-2 justify-content-between">
                    <Button
                      variant="warning"
                      onClick={() => handleEdit(product)}
                      size="sm"
                    >
                      Editează
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(product._id)}
                      size="sm"
                    >
                      Șterge
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProduct ? "Editează" : "Adaugă"} Produs
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Titlu</Form.Label>
              <Form.Control
                type="text"
                value={formData.Title}
                onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tip</Form.Label>
              <Form.Select
                value={selectedType}
                onChange={handleTypeChange}
                required
              >
                <option value="">Selectează un tip</option>
                {types.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </Form.Select>
              {selectedType === "Altele" && (
                <Form.Control
                  type="text"
                  placeholder="Introduceți tipul manual"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="mt-2"
                  required
                />
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Imagine</Form.Label>
              <Form.Control
                type="file"
                onChange={handleFileUpload}
                accept="image/jpeg, image/png, image/jpg"
              />
              {formData["Image Src"] && (
                <img
                  src={getImageUrl(formData["Image Src"])}
                  alt="Previzualizare"
                  style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                  className="mt-2"
                />
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descriere (HTML)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData["Body (HTML)"]}
                onChange={(e) => setFormData({ ...formData, "Body (HTML)": e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ambalaj</Form.Label>
              <Form.Control
                type="text"
                value={formData["Option1 Value"]}
                onChange={(e) => setFormData({ ...formData, "Option1 Value": e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Preț</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={formData["Variant Price"]}
                onChange={(e) => setFormData({ ...formData, "Variant Price": e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Utilizare</Form.Label>
              <Form.Control
                type="text"
                value={formData["Utilizare"]}
                onChange={(e) => setFormData({ ...formData, "Utilizare": e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Închide
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editingProduct ? "Salvează Modificările" : "Adaugă Produs"}
          </Button>
        </Modal.Footer>
      </Modal>

      {totalPages > 1 && (
        <Pagination className="mt-3 justify-content-center">
          {renderPaginationItems()}
        </Pagination>
      )}
    </div>
  );
};

export default AdminOilProducts;