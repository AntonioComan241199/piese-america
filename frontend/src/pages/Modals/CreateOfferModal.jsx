import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
const API_URL = import.meta.env.VITE_API_URL;


const CreateOfferModal = ({ show, onHide, onCreateOffer, order }) => {
  const [parts, setParts] = useState([]);
  const [newPart, setNewPart] = useState({
    partCode: "",
    partType: "",
    manufacturer: "",
    pricePerUnit: "",
    quantity: "",
    deliveryTerm: "",
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
    const { partCode, partType, manufacturer, pricePerUnit, quantity, deliveryTerm } = newPart;

    if (!partCode || !partType || !manufacturer || !pricePerUnit || !quantity || !deliveryTerm) {
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
      deliveryTerm: "",
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
  
      const response = await fetch(`${API_URL}/offer/admin`, {
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
        setParts([]); // Resetăm piesele
        setError(""); // Resetăm erorile
  
        // Apelăm API-ul backend pentru a trimite email-ul
        const emailResponse = await fetch(`${API_URL}/offer/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,  // Asigură-te că trimiteți tokenul corect aici
          },
          body: JSON.stringify({
            offerNumber: data.offer.offerNumber, // Trimitem numărul ofertei
            email: data.offer.orderId.email, // Email-ul destinatarului
          }),
        });
  
        if (emailResponse.ok) {
          alert("Oferta a fost trimisă pe email cu succes!");
        } else {
          const errorData = await emailResponse.json();
          alert("Eroare la trimiterea email-ului: " + errorData.message);
        }
  
        onHide(); // Închidem modalul
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
    <Modal show={show} onHide={onHide} size="lg" centered scrollable fullscreen="sm-down" >
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
            <Form.Control
              type="text"
              placeholder="Termen livrare ex: 2-3 zile lucrătoare"
              value={newPart.deliveryTerm}
              onChange={(e) =>
                setNewPart((prev) => ({ ...prev, deliveryTerm: e.target.value }))
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
                    {part.manufacturer}) - {part.total} RON,
                    Termen de livrare: {part.deliveryTerm && <small> {part.deliveryTerm}</small>}
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
