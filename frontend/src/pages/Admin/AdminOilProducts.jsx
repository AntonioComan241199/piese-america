import React, { useState, useEffect } from "react";
import { Table, Button, Form, Modal, Image } from "react-bootstrap";

const API_URL = import.meta.env.VITE_API_URL;

const AdminOilProducts = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    Title: "",
    Type: "",
    "Image Src": "",
    "Variant Price": "",
    "Body (HTML)": "",
    "Option1 Value": "",
    "Utilizare": "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const response = await fetch(`${API_URL}/oil-products`);
    const data = await response.json();
    setProducts(data);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setShowModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    const response = await fetch(`${API_URL}/oil-products/upload`, {
      method: "POST",
      body: formDataUpload,
    });

    const data = await response.json();
    console.log("🔹 Imagine încărcată cu succes:", data);

    setFormData((prevFormData) => ({
      ...prevFormData,
      "Image Src": data.imageUrl,
    }));
  };

  const handleSave = async () => {
    console.log("🔹 Trimitem request cu datele:", formData);

    if (!formData.Title || !formData.Type || !formData["Image Src"] || !formData["Variant Price"]) {
      alert("Toate câmpurile obligatorii trebuie completate: Title, Type, Image Src, Variant Price.");
      return;
    }

    const payload = {
      ...formData,
      "Utilizare": formData["Utilizare"], // Asigurăm că este noul nume corect
    };

    const method = editingProduct ? "PUT" : "POST";
    const url = editingProduct
      ? `${API_URL}/oil-products/${editingProduct._id}`
      : `${API_URL}/oil-products`;

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("🔹 Răspunsul serverului:", await response.json());

    setShowModal(false);
    fetchProducts();
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/oil-products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    return imagePath.startsWith("/uploads/")
      ? `${API_URL.replace("/api", "")}${imagePath}` // Eliminăm `/api` doar pentru imagini locale
      : imagePath;
  };

  return (
    <div className="container">
      <h2>Admin - Gestionare Produse</h2>
      <Button onClick={() => { setEditingProduct(null); setShowModal(true); }}>Adaugă Produs</Button>
      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Type</th>
            <th>Price</th>
            <th>Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>
                {product["Image Src"] ? (
                  <Image src={getImageUrl(product["Image Src"])} alt="product" width={50} height={50} rounded />
                ) : (
                  "N/A"
                )}
              </td>
              <td>{product.Title}</td>
              <td>{product.Type}</td>
              <td>{product["Variant Price"]} RON</td>
              <td>
                <Button variant="warning" onClick={() => handleEdit(product)}>Editează</Button>{" "}
                <Button variant="danger" onClick={() => handleDelete(product._id)}>Șterge</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? "Editează" : "Adaugă"} Produs</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group><Form.Label>Title</Form.Label><Form.Control value={formData.Title} onChange={(e) => setFormData({ ...formData, Title: e.target.value })} /></Form.Group>
            <Form.Group><Form.Label>Type</Form.Label><Form.Control value={formData.Type} onChange={(e) => setFormData({ ...formData, Type: e.target.value })} /></Form.Group>
            <Form.Group>
                <Form.Label>Imagine</Form.Label>
                <Form.Control type="file" onChange={handleFileUpload} accept="image/jpeg, image/png, image/jpg" />
            </Form.Group>
            {formData["Image Src"] && (
              <Image src={getImageUrl(formData["Image Src"])} alt="product preview" width={100} height={100} className="mt-2" rounded />
            )}
            <Form.Group>
                <Form.Label>Body (HTML)</Form.Label>
                <Form.Control 
                    as="textarea" 
                    rows={3} 
                    value={formData["Body (HTML)"]} 
                    onChange={(e) => setFormData({ ...formData, "Body (HTML)": e.target.value })} 
                />
            </Form.Group>

            <Form.Group><Form.Label>Option1 Value</Form.Label><Form.Control value={formData["Option1 Value"]} onChange={(e) => setFormData({ ...formData, "Option1 Value": e.target.value })} /></Form.Group>
            <Form.Group><Form.Label>Variant Price</Form.Label><Form.Control type="number" value={formData["Variant Price"]} onChange={(e) => setFormData({ ...formData, "Variant Price": e.target.value })} /></Form.Group>
            <Form.Group><Form.Label>Utilizare</Form.Label><Form.Control value={formData["Utilizare"]} onChange={(e) => setFormData({ ...formData, "Utilizare": e.target.value })} /></Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer><Button onClick={handleSave}>{editingProduct ? "Salvează Modificările" : "Adaugă Produs"}</Button></Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminOilProducts;
