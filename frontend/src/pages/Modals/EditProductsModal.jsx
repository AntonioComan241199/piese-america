import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { fetchWithAuth } from "../../utils/fetchWithAuth";
import { toast } from 'react-toastify';

const EditProductsModal = ({ show, onHide, offer, onUpdate }) => {
  const [parts, setParts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && offer) {
      setParts(offer.parts.map(part => ({
        ...part,
        total: part.pricePerUnit * part.quantity
      })));
      setError('');
    }
  }, [show, offer]);

  const handleFieldChange = (index, field, value) => {
    const updatedParts = [...parts];
    updatedParts[index] = {
      ...updatedParts[index],
      [field]: value
    };

    // Recalculăm totalul când se modifică prețul sau cantitatea
    if (field === 'pricePerUnit' || field === 'quantity') {
      updatedParts[index].total = 
        updatedParts[index].pricePerUnit * updatedParts[index].quantity;
    }

    setParts(updatedParts);
  };

  const validateParts = () => {
    for (const part of parts) {
      if (!part.partCode || !part.partType || !part.manufacturer || 
          !part.pricePerUnit || !part.quantity) {
        setError('Toate câmpurile sunt obligatorii pentru fiecare produs.');
        return false;
      }
      if (part.pricePerUnit <= 0 || part.quantity <= 0) {
        setError('Prețul și cantitatea trebuie să fie valori pozitive.');
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateParts()) return;
  
    try {
      setLoading(true);
      setError('');
  
      const data = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/offer/admin/${offer._id}/update-products`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            updatedProducts: parts.map(part => ({
              partCode: part.partCode,
              partType: part.partType,
              manufacturer: part.manufacturer,
              pricePerUnit: parseFloat(part.pricePerUnit),
              quantity: parseInt(part.quantity, 10),
              _id: part._id
            }))
          }),
        }
      );
  
      // Verificăm direct data pentru că fetchWithAuth deja face parse la JSON
      if (data.success) {
        toast.success('Produsele au fost actualizate cu succes!');
        onUpdate();
        onHide();
      } else {
        const errorMessage = data.message || 'Eroare la actualizarea produselor';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err.message || 'Eroare la actualizarea produselor';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Eroare:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && offer) {
      setParts(offer.parts.map(part => ({
        ...part,
        total: part.pricePerUnit * part.quantity
      })));
      setError('');
  
      // Verifică statusul ofertei
      if (!["proiect", "trimisa"].includes(offer.status)) {
        setError(`Oferta nu poate fi editată în statusul curent (${offer.status}).`);
      }
    }
  }, [show, offer]);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable fullscreen="sm-down">
      <Modal.Header closeButton>
        <Modal.Title>Editare produse - Oferta #{offer?.offerNumber}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
            {error && (
            <div className="alert alert-danger mb-4" role="alert">
                <div className="d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Eroare: </strong>
                <span className="ms-1">{error}</span>
                </div>
            </div>
            )}
          {parts.map((part, index) => (
            <div key={part._id || index} className="mb-4 p-3 border rounded shadow-sm">
              <h5 className="mb-3">Produs #{index + 1}</h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <Form.Group>
                    <Form.Label>Cod piesă</Form.Label>
                    <Form.Control
                      type="text"
                      value={part.partCode}
                      onChange={(e) => handleFieldChange(index, 'partCode', e.target.value)}
                      isInvalid={!part.partCode}
                    />
                    <Form.Control.Feedback type="invalid">
                      Codul piesei este obligatoriu
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group>
                    <Form.Label>Tip piesă</Form.Label>
                    <Form.Control
                      type="text"
                      value={part.partType}
                      onChange={(e) => handleFieldChange(index, 'partType', e.target.value)}
                      isInvalid={!part.partType}
                    />
                    <Form.Control.Feedback type="invalid">
                      Tipul piesei este obligatoriu
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group>
                    <Form.Label>Producător</Form.Label>
                    <Form.Control
                      type="text"
                      value={part.manufacturer}
                      onChange={(e) => handleFieldChange(index, 'manufacturer', e.target.value)}
                      isInvalid={!part.manufacturer}
                    />
                    <Form.Control.Feedback type="invalid">
                      Producătorul este obligatoriu
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group>
                    <Form.Label>Preț/unitate (RON)</Form.Label>
                    <Form.Control
                      type="number"
                      value={part.pricePerUnit}
                      onChange={(e) => handleFieldChange(index, 'pricePerUnit', parseFloat(e.target.value))}
                      isInvalid={part.pricePerUnit <= 0}
                      min="0.01"
                      step="0.01"
                    />
                    <Form.Control.Feedback type="invalid">
                      Prețul trebuie să fie pozitiv
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group>
                    <Form.Label>Cantitate</Form.Label>
                    <Form.Control
                      type="number"
                      value={part.quantity}
                      onChange={(e) => handleFieldChange(index, 'quantity', parseInt(e.target.value, 10))}
                      isInvalid={part.quantity <= 0}
                      min="1"
                    />
                    <Form.Control.Feedback type="invalid">
                      Cantitatea trebuie să fie cel puțin 1
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group>
                    <Form.Label>Total (RON)</Form.Label>
                    <Form.Control
                      type="text"
                      value={part.total?.toFixed(2)}
                      readOnly
                      disabled
                    />
                  </Form.Group>
                </div>
              </div>
            </div>
          ))}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Închide
        </Button>
        <Button 
        variant="primary" 
        onClick={handleSave}
        disabled={loading || !["proiect", "trimisa"].includes(offer?.status)}
        >
        {loading ? 'Se salvează...' : 'Salvează modificările'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditProductsModal;