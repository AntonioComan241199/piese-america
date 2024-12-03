import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const CreateOfferModal = ({ show, onHide, onCreateOffer, order }) => {
  const [parts, setParts] = useState([]);
  const [newPart, setNewPart] = useState({
    partCode: "",
    partType: "",
    manufacturer: "",
    pricePerUnit: "",
    quantity: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Flag pentru prevenirea apelurilor multiple

  useEffect(() => {
    if (order) {
      setParts([]);
      setError("");
      setIsSubmitting(false); // Resetăm flag-ul la deschiderea modalului
    }
  }, [order]);

  const handleAddPart = () => {
    const { partCode, partType, manufacturer, pricePerUnit, quantity } = newPart;

    if (!partCode || !partType || !manufacturer || !pricePerUnit || !quantity) {
      setError("Toate câmpurile sunt obligatorii pentru a adăuga o piesă.");
      return;
    }

    if (pricePerUnit <= 0 || quantity <= 0) {
      setError("Prețul și cantitatea trebuie să fie valori pozitive.");
      return;
    }

    setParts([...parts, { ...newPart, total: pricePerUnit * quantity }]);
    setNewPart({
      partCode: "",
      partType: "",
      manufacturer: "",
      pricePerUnit: "",
      quantity: "",
    });
    setError("");
  };

  const handleRemovePart = (index) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Evită apelurile duplicate

    if (!order || !parts.length) {
      setError("Trebuie să selectați o comandă și să adăugați cel puțin o piesă.");
      return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Nu sunt autentificat sau token-ul este lipsă.");
      return;
    }

    try {
      setIsSubmitting(true); // Blocare pentru apeluri duplicate

      const payload = {
        orderId: order._id,
        parts,
      };

      console.log("Payload trimis:", payload); // Debugging

      const response = await fetch("http://localhost:5000/api/offer/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        onCreateOffer(data.offer); // Callback pentru actualizare
        setParts([]);
        setError("");
        onHide();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Eroare la crearea ofertei.");
      }
    } catch (error) {
      setError("Eroare la trimiterea ofertei: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Creare ofertă pentru comanda #{order?.orderNumber}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {error && <div className="alert alert-danger">{error}</div>}

          <h5>Adaugă piese</h5>
          <div className="d-flex gap-2 mb-3">
            <Form.Control
              type="text"
              placeholder="Cod piesă"
              value={newPart.partCode}
              onChange={(e) =>
                setNewPart((prev) => ({ ...prev, partCode: e.target.value }))
              }
            />
            <Form.Control
              type="text"
              placeholder="Tip piesă"
              value={newPart.partType}
              onChange={(e) =>
                setNewPart((prev) => ({ ...prev, partType: e.target.value }))
              }
            />
            <Form.Control
              type="text"
              placeholder="Producător"
              value={newPart.manufacturer}
              onChange={(e) =>
                setNewPart((prev) => ({ ...prev, manufacturer: e.target.value }))
              }
            />
            <Form.Control
              type="number"
              placeholder="Preț/unitate"
              value={newPart.pricePerUnit}
              onChange={(e) =>
                setNewPart((prev) => ({
                  ...prev,
                  pricePerUnit: parseFloat(e.target.value),
                }))
              }
            />
            <Form.Control
              type="number"
              placeholder="Cantitate"
              value={newPart.quantity}
              onChange={(e) =>
                setNewPart((prev) => ({
                  ...prev,
                  quantity: parseInt(e.target.value, 10),
                }))
              }
            />
            <Button variant="primary" onClick={handleAddPart}>
              Adaugă
            </Button>
          </div>

          {parts.length > 0 && (
            <ul className="list-group mb-3">
              {parts.map((part, index) => (
                <li
                  key={index}
                  className="list-group-item d-flex justify-content-between"
                >
                  <span>
                    {part.partCode} - {part.partType} ({part.quantity} buc.,{" "}
                    {part.manufacturer}) - {part.total} RON
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemovePart(index)}
                  >
                    Șterge
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Închide
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
          Creează ofertă
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateOfferModal;
