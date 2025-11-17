import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { fetchWithAuth } from "../../utils/fetchWithAuth";
import { toast } from 'react-toastify';

const initialProductState = {
  partCode: '',
  partType: '',
  manufacturer: '',
  pricePerUnit: '',
  quantity: 1,
  deliveryTerm: ''
};

const AddProductsModal = ({ show, onHide, offer, onUpdate }) => {
  const [newProducts, setNewProducts] = useState([initialProductState]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) {
      setNewProducts([initialProductState]);
      setError('');
    }
  }, [show]);

  useEffect(() => {
      if (show && offer) {
        // Verifică statusul ofertei
        if (!["proiect", "trimisa"].includes(offer.status)) {
          setError(`Nu mai pot fi adaugate produse in statusul curent al ofertei! (${offer.status}).`);
        }
      }
    }, [show, offer]);

  const addNewProductField = () => {
    setNewProducts([...newProducts, { ...initialProductState }]);
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
    if (!validateProducts()) {
      toast.error('Verifică datele introduse înainte de a salva.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formattedProducts = newProducts.map(product => ({
        ...product,
        pricePerUnit: parseFloat(product.pricePerUnit),
        quantity: parseInt(product.quantity),
        deliveryTerm: product.deliveryTerm.trim()
      }));

      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/offer/admin/${offer._id}/add-products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ products: formattedProducts }),
        }
      );

      if (response.success) {
        toast.success('Produsele au fost adăugate cu succes!');
        onUpdate();
        onHide();
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
              <strong>Eroare: </strong>{error}
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
                {[
                  { label: 'Cod piesă', field: 'partCode', type: 'text' },
                  { label: 'Tip piesă', field: 'partType', type: 'text' },
                  { label: 'Producător', field: 'manufacturer', type: 'text' },
                  { label: 'Preț/unitate (RON)', field: 'pricePerUnit', type: 'number', min: '0.01', step: '0.01' },
                  { label: 'Cantitate', field: 'quantity', type: 'number', min: '1' },
                  { label: 'Termen livrare', field: 'deliveryTerm', type: 'text' }
                ].map(({ label, field, type, min, step }) => (
                  <div key={field} className="col-md-6">
                    <Form.Group>
                      <Form.Label>{label}</Form.Label>
                      <Form.Control
                        type={type}
                        value={product[field]}
                        onChange={(e) => handleFieldChange(index, field, e.target.value)}
                        min={min}
                        step={step}
                      />
                    </Form.Group>
                  </div>
                ))}
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
          {loading ? 'Se salvează...' : 'Salvează produsele'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddProductsModal;