import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftAlert, setShowDraftAlert] = useState(false);
  const [draftInfo, setDraftInfo] = useState(null);

  // Draft management functions
  const getDraftKey = useCallback((orderId) => `draft_offer_${orderId}`, []);

  const saveDraft = useCallback((orderId, partsData) => {
    if (!orderId || !partsData.length) return;
    
    const draftData = {
      parts: partsData,
      timestamp: new Date().toISOString(),
      orderNumber: order?.orderNumber
    };
    
    localStorage.setItem(getDraftKey(orderId), JSON.stringify(draftData));
  }, [getDraftKey, order?.orderNumber]);

  const loadDraft = useCallback((orderId) => {
    const draftData = localStorage.getItem(getDraftKey(orderId));
    return draftData ? JSON.parse(draftData) : null;
  }, [getDraftKey]);

  const deleteDraft = useCallback((orderId) => {
    localStorage.removeItem(getDraftKey(orderId));
  }, [getDraftKey]);

  // Auto-save draft when parts change
  useEffect(() => {
    if (order?._id && parts.length > 0) {
      saveDraft(order._id, parts);
    }
  }, [parts, order?._id, saveDraft]);

  // Check for existing draft when modal opens
  useEffect(() => {
    if (order && show) {
      const existingDraft = loadDraft(order._id);
      if (existingDraft && existingDraft.parts.length > 0) {
        setDraftInfo(existingDraft);
        setShowDraftAlert(true);
      } else {
        setParts([]);
        setError("");
        setIsSubmitting(false);
        setShowDraftAlert(false);
      }
    }
  }, [order, show, loadDraft]);

  const handleAddPart = () => {
    // Block adding parts if draft decision is pending
    if (showDraftAlert) {
      setError("Trebuie să alegi mai întâi ce faci cu draft-ul existent.");
      return;
    }

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

  // Draft management handlers
  const handleContinueDraft = () => {
    if (draftInfo) {
      setParts(draftInfo.parts);
      setShowDraftAlert(false);
      setError("");
    }
  };

  const handleStartFresh = () => {
    setParts([]);
    setShowDraftAlert(false);
    setError("");
    if (order?._id) {
      deleteDraft(order._id);
    }
  };

  const handleClearDraft = () => {
    if (order?._id) {
      deleteDraft(order._id);
      setParts([]);
      setError("");
    }
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
        
        // Clear draft after successful offer creation
        if (order?._id) {
          deleteDraft(order._id);
        }
        
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

          {/* Draft Alert */}
          {showDraftAlert && draftInfo && (
            <Alert variant="info" className="mb-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="mb-2">
                    <i className="ri-draft-line me-2"></i>
                    Draft găsit pentru comanda #{draftInfo.orderNumber}
                  </h6>
                  <p className="mb-2">
                    Ai un draft salvat cu <strong>{draftInfo.parts.length} piese</strong>.
                    <br />
                    <small className="text-muted">
                      Salvat la: {new Date(draftInfo.timestamp).toLocaleString('ro-RO')}
                    </small>
                  </p>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={handleContinueDraft}
                    >
                      Continuă draft-ul
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={handleStartFresh}
                    >
                      Începe de la zero
                    </Button>
                  </div>
                </div>
              </div>
            </Alert>
          )}

          {/* Draft Status */}
          {!showDraftAlert && parts.length > 0 && order?._id && (
            <Alert variant="success" className="mb-3 py-2">
              <small>
                <i className="ri-save-line me-1"></i>
                Draft salvat automat ({parts.length} piese)
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 ms-2 text-decoration-none" 
                  onClick={handleClearDraft}
                >
                  Șterge draft
                </Button>
              </small>
            </Alert>
          )}

          <h5>Adaugă piese</h5>
          <div className="d-flex gap-2 mb-3">
            <Form.Control
              type="text"
              placeholder="Cod piesă"
              value={newPart.partCode}
              disabled={showDraftAlert}
              onChange={(e) =>
                setNewPart((prev) => ({ ...prev, partCode: e.target.value }))
              }
            />
            <Form.Control
              type="text"
              placeholder="Tip piesă"
              value={newPart.partType}
              disabled={showDraftAlert}
              onChange={(e) =>
                setNewPart((prev) => ({ ...prev, partType: e.target.value }))
              }
            />
            <Form.Control
              type="text"
              placeholder="Producător"
              value={newPart.manufacturer}
              disabled={showDraftAlert}
              onChange={(e) =>
                setNewPart((prev) => ({ ...prev, manufacturer: e.target.value }))
              }
            />
            <Form.Control
              type="number"
              placeholder="Preț/unitate"
              value={newPart.pricePerUnit}
              disabled={showDraftAlert}
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
              disabled={showDraftAlert}
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
              disabled={showDraftAlert}
              onChange={(e) =>
                setNewPart((prev) => ({ ...prev, deliveryTerm: e.target.value }))
              }
            />
            <Button 
              variant="primary" 
              onClick={handleAddPart}
              disabled={showDraftAlert}
              title={showDraftAlert ? "Alege mai întâi ce faci cu draft-ul" : ""}
            >
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
                    disabled={showDraftAlert}
                    title={showDraftAlert ? "Alege mai întâi ce faci cu draft-ul" : ""}
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
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={isSubmitting || showDraftAlert}
          title={showDraftAlert ? "Alege mai întâi ce faci cu draft-ul" : ""}
        >
          Creează ofertă
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateOfferModal;
