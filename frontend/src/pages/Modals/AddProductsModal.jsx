import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { fetchWithAuth } from "../../utils/fetchWithAuth";
import { toast } from 'react-toastify';

const AddProductsModal = ({ show, onHide, offer, onUpdate }) => {
  const [newProducts, setNewProducts] = useState([{
    partCode: '',
    partType: '',
    manufacturer: '',
    pricePerUnit: '',
    quantity: 1,
    deliveryTerm: ''
  }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setError('');
      // Verifică statusul ofertei
      if (!["proiect", "trimisa"].includes(offer?.status)) {
        setError(`Oferta nu poate fi modificată în statusul curent (${offer?.status}).`);
      }
    }
  }, [show, offer]);

  const addNewProductField = () => {
    setNewProducts([...newProducts, {
      partCode: '',
      partType: '',
      manufacturer: '',
      pricePerUnit: '',
      quantity: 1,
      deliveryTerm: ''
    }]);
  };

  const removeProductField = (index) => {
    const updatedProducts = newProducts.filter((_, idx) => idx !== index);
    setNewProducts(updatedProducts);
  };

  const handleFieldChange = (index, field, value) => {
    const updatedProducts = [...newProducts];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value
    };
    setNewProducts(updatedProducts);
  };

  const validateProducts = () => {
    for (const product of newProducts) {
      if (!product.partCode || !product.partType || !product.manufacturer || 
          !product.pricePerUnit || !product.quantity || !product.deliveryTerm) {
        setError('Toate câmpurile sunt obligatorii pentru fiecare produs.');
        return false;
      }
      if (parseFloat(product.pricePerUnit) <= 0 || parseInt(product.quantity) <= 0) {
        setError('Prețul și cantitatea trebuie să fie valori pozitive.');
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateProducts()) return;

    try {
      setLoading(true);
      setError('');

      const formattedProducts = newProducts.map(product => ({
        ...product,
        pricePerUnit: parseFloat(product.pricePerUnit),
        quantity: parseInt(product.quantity)
      }));

      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/offer/${offer._id}/add-products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newProducts: formattedProducts }),
        }
      );

      if (response.success) {
        toast.success('Produsele au fost adăugate cu succes!');
        onUpdate();
        onHide();
        setNewProducts([{
          partCode: '',
          partType: '',
          manufacturer: '',
          pricePerUnit: '',
          quantity: 1,
          deliveryTerm: ''
        }]);
      } else {
        throw new Error(response.message || 'Eroare la adăugarea produselor');
      }
    } catch (err) {
      const errorMessage = err.message || 'Eroare la adăugarea produselor';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable fullscreen="sm-down">
      <Modal.Header closeButton>
        <Modal.Title>Adaugă produse noi - Oferta #{offer?.offerNumber}</Modal.Title>
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

          {newProducts.map((product, index) => (
            <div key={index} className="mb-4 p-3 border rounded shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Produs nou #{index + 1}</h5>
                {newProducts.length > 1 && (
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => removeProductField(index)}
                  >
                    <i className="bi bi-trash"></i> Șterge
                  </Button>
                )}
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Cod piesă</Form.Label>
                    <Form.Control
                      type="text"
                      value={product.partCode}
                      onChange={(e) => handleFieldChange(index, 'partCode', e.target.value)}
                      isInvalid={!product.partCode}
                    />
                  </Form.Group>
                </div>

                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Tip piesă</Form.Label>
                    <Form.Control
                      type="text"
                      value={product.partType}
                      onChange={(e) => handleFieldChange(index, 'partType', e.target.value)}
                      isInvalid={!product.partType}
                    />
                  </Form.Group>
                </div>

                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Producător</Form.Label>
                    <Form.Control
                      type="text"
                      value={product.manufacturer}
                      onChange={(e) => handleFieldChange(index, 'manufacturer', e.target.value)}
                      isInvalid={!product.manufacturer}
                    />
                  </Form.Group>
                </div>

                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Preț/unitate (RON)</Form.Label>
                    <Form.Control
                      type="number"
                      value={product.pricePerUnit}
                      onChange={(e) => handleFieldChange(index, 'pricePerUnit', e.target.value)}
                      isInvalid={parseFloat(product.pricePerUnit) <= 0}
                      min="0.01"
                      step="0.01"
                    />
                  </Form.Group>
                </div>

                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Cantitate</Form.Label>
                    <Form.Control
                      type="number"
                      value={product.quantity}
                      onChange={(e) => handleFieldChange(index, 'quantity', e.target.value)}
                      isInvalid={parseInt(product.quantity) <= 0}
                      min="1"
                    />
                  </Form.Group>
                </div>

                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Termen livrare</Form.Label>
                    <Form.Control
                      type="text"
                      value={product.deliveryTerm}
                      onChange={(e) => handleFieldChange(index, 'deliveryTerm', e.target.value)}
                      isInvalid={!product.deliveryTerm}
                    />
                  </Form.Group>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center mt-3">
            <Button 
              variant="success" 
              onClick={addNewProductField}
              className="w-100"
            >
              <i className="bi bi-plus-circle me-2"></i>
              Adaugă încă un produs
            </Button>
          </div>
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
          {loading ? 'Se salvează...' : 'Salvează produsele'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddProductsModal;