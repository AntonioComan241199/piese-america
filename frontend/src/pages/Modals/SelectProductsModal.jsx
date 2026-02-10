import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Tooltip, OverlayTrigger, Card, ButtonGroup } from "react-bootstrap";
import locations from "../../assets/locations.json";
const API_URL = import.meta.env.VITE_API_URL;


const SelectProductsModal = ({
  show,
  onHide,
  offer,
  onSaveSelection,
  onAcceptOffer,
  onRejectOffer,
  readonlyMode = false, // Prop pentru a bloca navigarea
}) => {
  const [groupedParts, setGroupedParts] = useState([]);
  const [selections, setSelections] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSelectie, setTotalSelectie] = useState(0);
  const [showDecisionButtons, setShowDecisionButtons] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // Stare pentru noul modal
  const [confirmationMessage, setConfirmationMessage] = useState(""); // Stare pentru mesajul de confirmare
  const [showQuantityModal, setShowQuantityModal] = useState(false); // Modal pentru editare cantitate
  const [quantityModalData, setQuantityModalData] = useState({ partType: "", optionId: "", currentQuantity: 1 }); // Date pentru modal cantitate
  const [newQuantity, setNewQuantity] = useState(1); // Cantitatea nouă din modal


  const [errors, setErrors] = useState({
    billingCounty: "",
    billingCity: "",
    billingStreet: "",
    billingNumber: "",
    deliveryCounty: "",
    deliveryStreet: "",
    deliveryNumber: "",
  });
  

  const [billingAddress, setBillingAddress] = useState({
    street: "",
    number: "",
    block: "",
    entrance: "",
    apartment: "",
    county: "",
    city: "",
  });
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    number: "",
    block: "",
    entrance: "",
    apartment: "",
    county: "",
    city: "",
  });
  const [isDeliverySame, setIsDeliverySame] = useState(false);
  const [pickupAtCentral, setPickupAtCentral] = useState(false);
  const [isBillingAddressSaved, setIsBillingAddressSaved] = useState(false); // Verifică dacă adresa de facturare este salvată

  const saveBillingAddress = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Trebuie să fii autentificat pentru a salva adresa.");
      }
  
      const response = await fetch(`${API_URL}/user/billing-address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ billingAddress }),
      });
  
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Eroare la salvarea adresei.");
      }
  
      setIsBillingAddressSaved(true);
      setConfirmationMessage("Adresa de facturare a fost salvată cu succes."); // Mesaj de confirmare
  
      setTimeout(() => setConfirmationMessage(""), 3000); // Ascundem mesajul după 3 secunde
    } catch (error) {
      console.error("Eroare:", error.message);
      alert(`Eroare: ${error.message}`);
    }
  };
  
  

  useEffect(() => {
    if (!readonlyMode) {
      // Obține adresa salvată din backend
      const fetchBillingAddress = async () => {
        try {
          const token = localStorage.getItem("accessToken");
          if (!token) return;

          const response = await fetch(`${API_URL}/user/billing-address`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setBillingAddress(data.billingAddress || {});
          }
        } catch (error) {
          console.error("Eroare la obținerea adresei de facturare:", error);
        }
      };

      fetchBillingAddress();
    }
  }, [readonlyMode]);

  


  useEffect(() => {
    if (readonlyMode) {
      setCurrentStep(3); // Setăm direct pe pasul 3 pentru vizualizare
    }
  }, [readonlyMode]);

  
  useEffect(() => {
    if (!show) {
      setCurrentStep(1); // Resetează modalul la pasul 1 când este închis
      setShowDecisionButtons(false); // Resetează butoanele de decizie

    }
  }, [show]);
  
  useEffect(() => {
    if (!show) {
      setShowDecisionButtons(false); // Resetează butoanele de decizie
    }
  }, [show]);
  

  const counties = [...new Set(locations.map((location) => location.judet))].sort((a, b) => {
    if (a === "BUCURESTI") return -1;
    if (b === "BUCURESTI") return 1;
    return a.localeCompare(b);
  });

  const citiesByCounty = (county) =>locations.filter((location) => location.judet === county).map((location) => location.nume).sort((a, b) => a.localeCompare(b));

  // useEffect pentru readonlyMode = true
  useEffect(() => {
    if (show) {
      if (readonlyMode && offer) {
        setBillingAddress(offer.billingAddress || {});
        setDeliveryAddress(offer.deliveryAddress || {});
        setPickupAtCentral(offer.pickupAtCentral || false);
        setSelections(
          offer.selectedParts?.map((part) => ({
            partType: part.partType || "Tip necunoscut",
            selectedOption: part.selectedOption || null,
            include: true,
            manufacturer: part.manufacturer || "N/A",
            pricePerUnit: part.pricePerUnit || 0,
            quantity: part.quantity || 0,
            partCode: part.partCode || "N/A",
            deliveryTerm: part.deliveryTerm || "N/A",
            total: part.total || 0,
          })) || []
        );
      } else if (!readonlyMode && offer?.parts) {
        const grouped = {};
        offer.parts.forEach((part) => {
          if (!grouped[part.partType]) {
            grouped[part.partType] = { partType: part.partType, options: [] };
          }
          part.options.forEach((option) => {
            grouped[part.partType].options.push({
              optionId: option._id,
              manufacturer: option.manufacturer,
              price: option.price,
              quantity: part.quantity,
              partCode: part.partCode || "N/A",
              deliveryTerm: part.deliveryTerm || "N/A",
            });
          });
        });
  
        setGroupedParts(Object.values(grouped));
        setSelections(
          Object.values(grouped).flatMap((group) =>
            group.options.map((option) => ({
              partType: group.partType,
              selectedOption: option.optionId,
              include: false,
              manufacturer: option.manufacturer,
              pricePerUnit: option.price,
              quantity: option.quantity,
              partCode: option.partCode,
              deliveryTerm: option.deliveryTerm || "N/A",
              total: 0,
            }))
          )
        );
      }
    }
  }, [show, readonlyMode, offer]);
  
  useEffect(() => {
    if (!readonlyMode && offer && Array.isArray(offer.parts)) {
      const grouped = {};
  
      offer.parts.forEach((part) => {
        if (!grouped[part.partType]) {
          grouped[part.partType] = {
            partType: part.partType,
            options: [], // Fiecare opțiune va avea cantitatea proprie
          };
        }
  
        if (part.options && part.options.length > 0) {
          part.options.forEach((option) => {
            grouped[part.partType].options.push({
              optionId: option._id,
              manufacturer: option.manufacturer || "N/A",
              price: option.price || 0,
              quantity: part.quantity, // Cantitatea specifică acestei opțiuni
              partCode: part.partCode || "N/A",
              deliveryTerm: part.deliveryTerm || "N/A",
              partId: part._id,
            });
          });
        }
      });
  
      const groupedPartsArray = Object.values(grouped);
      setGroupedParts(groupedPartsArray);
  
      const initialSelections = groupedPartsArray.flatMap((group) =>
        group.options.map((option) => ({
          partType: group.partType,
          selectedOption: option.optionId,
          include: false, // Implicit, opțiunile nu sunt selectate
          manufacturer: option.manufacturer,
          pricePerUnit: option.price,
          quantity: option.quantity,
          partCode: option.partCode,
          deliveryTerm: option.deliveryTerm, // Adăugat aici
          total: 0,
        }))
      );
      setSelections(initialSelections);
    }
  }, [readonlyMode, offer]);
   
  useEffect(() => {
    if (isDeliverySame) {
      setDeliveryAddress(billingAddress);
    }
  }, [isDeliverySame, billingAddress]);

  useEffect(() => {
    if (!readonlyMode && offer?.parts) {
      const grouped = {};
      offer.parts.forEach((part) => {
        if (!grouped[part.partType]) {
          grouped[part.partType] = { partType: part.partType, options: [] };
        }
        part.options.forEach((option) => {
          grouped[part.partType].options.push({
            optionId: option._id,
            manufacturer: option.manufacturer,
            price: option.price,
            quantity: part.quantity, // Cantitatea asociată acestei opțiuni
            partCode: part.partCode || "N/A",
            deliveryTerm: part.deliveryTerm || "N/A",
          });
        });
      });
      setGroupedParts(Object.values(grouped));

      // Initializează selecțiile implicite
      const initialSelections = Object.values(grouped).flatMap((group) =>
        group.options.map((option) => ({
          partType: group.partType,
          selectedOption: option.optionId,
          include: false,
          quantity: option.quantity,
          pricePerUnit: option.price,
          partCode: option.partCode,
          deliveryTerm: option.deliveryTerm || "N/A",
          manufacturer: option.manufacturer,
          total: 0,
        }))
      );
      setSelections(initialSelections);
    }
  }, [offer, readonlyMode]);

  useEffect(() => {
    const total = selections.reduce((sum, selection) => sum + (selection.include ? selection.total : 0), 0);
    setTotalSelectie(total);
  }, [selections])

  const handleAddressChange = (field, value, addressType = "billing") => {
    const setAddress =
      addressType === "billing" ? setBillingAddress : setDeliveryAddress;
    const address = addressType === "billing" ? billingAddress : deliveryAddress;
  
    if (addressType === "billing") {
      setIsBillingAddressSaved(false); // Resetăm starea "salvat" dacă se modifică adresa de facturare
    }
  
    setAddress({ ...address, [field]: value });
  };
  

  const handleFinalizeSelections = () => {
    setShowConfirmationModal(true); // Deschide modalul de confirmare
  };

  const handleOpenConfirmationModal = () => {
    setShowConfirmationModal(true); // Afișează noul modal
  };

  

  const handleAcceptOffer = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Autentificare necesară.");
      }
  
      const dataToSave = {
        selectedParts: selections
          .filter((selection) => selection.include && selection.selectedOption)
          .map((selection) => {
            // Asigură-te că cantitatea este actualizată cu cea din groupedParts
            const groupedPart = groupedParts
              .find(group => group.partType === selection.partType)
              ?.options.find(option => option.optionId === selection.selectedOption);
            
            const finalQuantity = groupedPart?.quantity || selection.quantity;
            console.log('Selection:', selection.partType, 'Original qty:', selection.quantity, 'New qty:', finalQuantity);
            
            return {
              ...selection,
              quantity: finalQuantity,
              total: selection.pricePerUnit * finalQuantity,
            };
          }),
        billingAddress,
        deliveryAddress: pickupAtCentral ? null : deliveryAddress,
        pickupAtCentral,
      };
      
      console.log('Data to save:', dataToSave);
  
      // Salvează selecțiile
      let response = await fetch(
        `${API_URL}/offer/${offer._id}/selected-parts`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dataToSave),
        }
      );
  
      let result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Eroare la salvarea selecțiilor.");
      }
  
      // Schimbă statusul în "oferta_acceptata"
      response = await fetch(`${API_URL}/offer/${offer._id}/accept`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Eroare la acceptarea ofertei.");
      }
  
      // Trimite notificare email către admin
      const emailResponse = await fetch(`${API_URL}/offer/accept-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ offerNumber: offer.offerNumber }),
      });
  
      if (!emailResponse.ok) {
        console.error("Eroare la trimiterea email-ului către administrator.");
      }
  
      alert("Oferta a fost acceptată cu succes!");
      setShowConfirmationModal(false); // Închide modalul
      onHide(); // Închide și modalul principal
    } catch (error) {
      console.error("Eroare:", error.message);
      alert(`Eroare: ${error.message}`);
    }
  };
  
  
  const handleRejectOffer = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Autentificare necesară.");
      }
  
      const response = await fetch(
        `${API_URL}/offer/${offer._id}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Eroare la respingerea ofertei.");
      }
  
      // Trimite notificare email către admin
      const emailResponse = await fetch(`${API_URL}/offer/reject-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ offerNumber: offer.offerNumber }),
      });
  
      if (!emailResponse.ok) {
        console.error("Eroare la trimiterea email-ului către administrator.");
      }
  
      alert("Oferta a fost respinsă cu succes!");
      setShowConfirmationModal(false); // Închide modalul
      onHide(); // Închide și modalul principal
    } catch (error) {
      console.error("Eroare:", error.message);
      alert(`Eroare: ${error.message}`);
    }
  };
  

  useEffect(() => {
  if (offer && offer.status === "comanda_spre_finalizare") {
    setShowDecisionButtons(true);
  } else {
    setShowDecisionButtons(false);
  }
}, [offer]);

const handleSelectOption = (partType, optionId) => {
  setSelections((prevSelections) =>
    prevSelections.map((selection) => {
      if (selection.partType === partType) {
        const isSelected = selection.selectedOption === optionId;
        return {
          ...selection,
          include: isSelected,
          total: isSelected ? selection.pricePerUnit * selection.quantity : 0,
        };
      }
      return selection;
    })
  );
};

const handleQuantityChange = (partType, optionId, newQuantity) => {
  const quantity = Math.max(1, parseInt(newQuantity) || 1); // Minimum 1, default 1
  setSelections((prevSelections) =>
    prevSelections.map((selection) => {
      if (selection.partType === partType && selection.selectedOption === optionId) {
        return {
          ...selection,
          quantity: quantity,
          total: selection.include ? selection.pricePerUnit * quantity : 0,
        };
      }
      return selection;
    })
  );
  
  // Actualizează și în groupedParts pentru a reflecta cantitatea în interfață
  setGroupedParts((prevGroupedParts) =>
    prevGroupedParts.map((group) => {
      if (group.partType === partType) {
        return {
          ...group,
          options: group.options.map((option) => {
            if (option.optionId === optionId) {
              return {
                ...option,
                quantity: quantity,
              };
            }
            return option;
          }),
        };
      }
      return group;
    })
  );
};

const openQuantityModal = (partType, optionId, currentQuantity) => {
  setQuantityModalData({ partType, optionId, currentQuantity });
  setNewQuantity(currentQuantity);
  setShowQuantityModal(true);
};

const handleQuantityModalSave = () => {
  handleQuantityChange(quantityModalData.partType, quantityModalData.optionId, newQuantity);
  setShowQuantityModal(false);
};

const handleQuantityModalClose = () => {
  setShowQuantityModal(false);
  setNewQuantity(1);
};

const handleClearOption = (partType, optionId) => {
  setSelections((prevSelections) =>
    prevSelections.map((selection) => {
      if (
        selection.partType === partType &&
        selection.selectedOption === optionId
      ) {
        return {
          ...selection,
          include: false,
          total: 0,
        };
      }
      return selection;
    })
  );
};

const renderStep1 = () => (
  <Form>
    <h4 className="mb-4 text-center text-primary">Selectează piesele dorite</h4>
    <p className="text-muted mb-4 text-center">
      Alege opțiunile pentru fiecare piesă disponibilă. Fiecare piesă este identificată printr-un cod unic
      (<strong>Cod Piesă</strong>).
    </p>

    {groupedParts.length > 0 ? (
      <div className="row g-4">
        {groupedParts.map((group, index) => (
          <div key={index} className="col-12 col-lg-6 col-xl-4 mb-4">
            <Card className="shadow-sm h-100 border-0 rounded">
              <Card.Header className="bg-primary text-white text-center rounded-top">
                <h5 className="m-0">{group.partType}</h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted">
                  Alege opțiunea potrivită pentru <strong>{group.partType}</strong>:
                </p>
                <ButtonGroup vertical className="w-100">
                  {group.options.map((option) => {
                    const isSelected = selections.some(
                      (selection) =>
                        selection.partType === group.partType &&
                        selection.selectedOption === option.optionId &&
                        selection.include
                    );

                    return (
                      <Button
                        key={option.optionId}
                        variant={isSelected ? "danger" : "outline-success"}
                        className="mb-3 text-start py-4 d-flex flex-column align-items-stretch position-relative"
                        onClick={() =>
                          isSelected
                            ? handleClearOption(group.partType, option.optionId)
                            : handleSelectOption(group.partType, option.optionId)
                        }
                        style={{ minHeight: '200px' }}
                      >
                        <div className="flex-grow-1">
                          <span
                            className="badge bg-info text-dark me-2 mb-2"
                            style={{ fontSize: "0.85rem" }}
                          >
                            Cod piesă: {option.partCode}
                          </span>
                          <br />
                          
                          <div className="mb-2">
                            <strong>{option.manufacturer}</strong> - {option.price} RON/buc fara TVA
                          </div>
                          
                          <div className="mb-2">
                            <small className="text-muted">Termen livrare: <strong>{option.deliveryTerm || 'N/A'}</strong></small>
                          </div>
                          
                          <div className="mb-3">
                            <div className="mb-2">
                              <span><strong>Cantitate:</strong> {
                                isSelected ? 
                                  (selections.find(s => s.partType === group.partType && s.selectedOption === option.optionId)?.quantity || option.quantity) :
                                  option.quantity
                              } bucăți</span>
                            </div>
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentQuantity = isSelected ? 
                                  (selections.find(s => s.partType === group.partType && s.selectedOption === option.optionId)?.quantity || option.quantity) :
                                  option.quantity;
                                openQuantityModal(group.partType, option.optionId, currentQuantity);
                              }}
                              className="w-100 fw-bold border-2"
                              style={{ 
                                backgroundColor: '#ffc107', 
                                borderColor: '#f0ad4e',
                                color: '#212529',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                            >
                              <i className="fas fa-edit me-2"></i>Editează Cantitatea
                            </Button>
                          </div>
                          
                          <div className="small text-muted">
                            <div>Subtotal fara TVA: <strong>{(option.price * (
                              isSelected ? 
                                (selections.find(s => s.partType === group.partType && s.selectedOption === option.optionId)?.quantity || option.quantity) :
                                option.quantity
                            )).toFixed(2)} RON</strong></div>
                            <div>Subtotal cu TVA: <strong>{(option.price * (
                              isSelected ? 
                                (selections.find(s => s.partType === group.partType && s.selectedOption === option.optionId)?.quantity || option.quantity) :
                                option.quantity
                            ) * 1.21).toFixed(2)} RON</strong></div>
                          </div>
                        </div>
                        
                        <div className="mt-auto pt-2 border-top">
                          <div
                            className={`badge w-100 py-2 ${
                              isSelected ? "bg-light text-danger" : "bg-light text-success"
                            }`}
                            style={{ fontSize: "1rem", fontWeight: "bold" }}
                          >
                            {isSelected ? "✓ SELECTAT - Elimină" : "⊕ SELECTEAZĂ"}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </ButtonGroup>
              </Card.Body>
              <Card.Footer className="text-center bg-light rounded-bottom">
                <p className="text-muted small">
                  Cod piesă afișat pentru fiecare opțiune. Apasă „Selectează” pentru a alege piesa.
                </p>
              </Card.Footer>
            </Card>
          </div>
        ))}
      </div>
    ) : (
      <div className="alert alert-warning text-center">
        Nu există piese disponibile pentru selecție. Încearcă din nou mai târziu.
      </div>
    )}
    <div className="d-flex justify-content-end mt-4">
      <h5 className="text-primary">Total selecție fara TVA: {totalSelectie} RON</h5>
    </div>
    <div className="d-flex justify-content-end mt-4">
      <h5 className="text-primary">Total selecție cu TVA: {totalSelectie*1.21} RON</h5>
    </div>
  </Form>
);


const renderStep2 = () => {
  const validateStep2 = () => {
    const newErrors = {};

    // Validare facturare
    if (!billingAddress.county) newErrors.billingCounty = "Județul este obligatoriu.";
    if (!billingAddress.city) newErrors.billingCity = "Orașul este obligatoriu.";
    if (!billingAddress.street) newErrors.billingStreet = "Strada este obligatorie.";
    if (!billingAddress.number) newErrors.billingNumber = "Numărul este obligatoriu.";

    // Validare livrare (dacă este activă)
    if (!pickupAtCentral && !isDeliverySame) {
      if (!deliveryAddress.county) newErrors.deliveryCounty = "Județul este obligatoriu.";
      if (!deliveryAddress.city) newErrors.deliveryCity = "Orașul este obligatoriu.";
      if (!deliveryAddress.street) newErrors.deliveryStreet = "Strada este obligatorie.";
      if (!deliveryAddress.number) newErrors.deliveryNumber = "Numărul este obligatoriu.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // True dacă nu sunt erori
  };

  const handleNextStep = () => {
    if (validateStep2()) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <Form>
      {/* Adresa de facturare */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="m-0">Adresa de facturare</h5>
        </div>
        <div className="card-body">
          <Form.Group controlId="billingCounty" className="mb-3">
            <Form.Label>Județ</Form.Label>
            <Form.Control
              as="select"
              value={billingAddress.county}
              onChange={(e) => handleAddressChange("county", e.target.value, "billing")}
              isInvalid={!!errors.billingCounty}
            >
              <option value="">Selectează județul</option>
              {counties.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </Form.Control>
            {errors.billingCounty && (
              <Form.Text className="text-danger">{errors.billingCounty}</Form.Text>
            )}
          </Form.Group>

          {billingAddress.county && (
            <Form.Group controlId="billingCity" className="mb-3">
              <Form.Label>Oraș</Form.Label>
              <Form.Control
                as="select"
                value={billingAddress.city}
                onChange={(e) => handleAddressChange("city", e.target.value, "billing")}
              >
                <option value="">Selectează orașul</option>
                {citiesByCounty(billingAddress.county).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </Form.Control>
              {errors.billingCity && (
                <Form.Text className="text-danger">{errors.billingCity}</Form.Text>
              )}
            </Form.Group>
          )}

          {/* Câmpuri obligatorii */}
          <Form.Group controlId="billingStreet" className="mb-3">
            <Form.Label>Strada</Form.Label>
            <Form.Control
              type="text"
              value={billingAddress.street}
              onChange={(e) => handleAddressChange("street", e.target.value, "billing")}
              isInvalid={!!errors.billingStreet}
            />
            {errors.billingStreet && (
              <Form.Text className="text-danger">{errors.billingStreet}</Form.Text>
            )}
          </Form.Group>

          <Form.Group controlId="billingNumber" className="mb-3">
            <Form.Label>Număr</Form.Label>
            <Form.Control
              type="text"
              value={billingAddress.number}
              onChange={(e) => handleAddressChange("number", e.target.value, "billing")}
              isInvalid={!!errors.billingNumber}
            />
            {errors.billingNumber && (
              <Form.Text className="text-danger">{errors.billingNumber}</Form.Text>
            )}
          </Form.Group>

          {/* Câmpuri opționale */}
          {[
            { field: "block", label: "Bloc" },
            { field: "entrance", label: "Scară" },
            { field: "apartment", label: "Apartament" },
          ].map(({ field, label }, index) => (
            <Form.Group key={index} controlId={`billing${field}`} className="mb-3">
              <Form.Label>{label}</Form.Label>
              <Form.Control
                type="text"
                value={billingAddress[field]}
                onChange={(e) => handleAddressChange(field, e.target.value, "billing")}
              />
            </Form.Group>
          ))}

          {/* Buton pentru salvare adresă */}
          <div className="d-flex justify-content-end">
          <Button
            variant="success"
            onClick={saveBillingAddress}
            disabled={isBillingAddressSaved && !Object.values(billingAddress).some((value) => value === "")}
          >
            {isBillingAddressSaved ? "Adresă salvată" : "Salvează adresa de facturare"}
          </Button>
          </div>
        </div>
      </div>
      {/* Mesaj de confirmare */}
      {confirmationMessage && (
        <div className="alert alert-success text-center mb-3">
          {confirmationMessage}
        </div>
      )}

      {/* Opțiuni de livrare */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-secondary text-white">
          <h5 className="m-0">Opțiuni de livrare</h5>
        </div>
        <div className="card-body">
          <div className="d-flex flex-column gap-3">
            <Button
              variant={pickupAtCentral ? "success" : "outline-success"}
              className="py-3"
              onClick={() => {
                setPickupAtCentral(true);
                setIsDeliverySame(false);
              }}
            >
              Ridicare produse de la sediu central
            </Button>
            <Button
              variant={!pickupAtCentral && !isDeliverySame ? "success" : "outline-success"}
              className="py-3"
              onClick={() => {
                setPickupAtCentral(false);
                setIsDeliverySame(false);
              }}
            >
              Livrare la adresa specificată
            </Button>
            <Button
              variant={isDeliverySame ? "success" : "outline-success"}
              className="py-3"
              onClick={() => {
                setPickupAtCentral(false);
                setIsDeliverySame(true);
                setDeliveryAddress(billingAddress);
              }}
            >
              Adresa de livrare este aceeași cu adresa de facturare
            </Button>
          </div>
        </div>
      </div>
  
      {/* Adresa de livrare */}
      {!pickupAtCentral && !isDeliverySame && (
        <div className="card shadow-sm">
          <div className="card-header bg-secondary text-white">
            <h5 className="m-0">Adresa de livrare</h5>
          </div>
          <div className="card-body">
            <Form.Group controlId="deliveryCounty" className="mb-3">
              <Form.Label>Județ</Form.Label>
              <Form.Control
                as="select"
                value={deliveryAddress.county}
                onChange={(e) => handleAddressChange("county", e.target.value, "delivery")}
                isInvalid={!!errors.deliveryCounty}
              >
                <option value="">Selectează județul</option>
                {counties.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </Form.Control>
              {errors.deliveryCounty && (
                <Form.Text className="text-danger">{errors.deliveryCounty}</Form.Text>
              )}
            </Form.Group>
  
            {deliveryAddress.county && (
              <Form.Group controlId="deliveryCity" className="mb-3">
                <Form.Label>Oraș</Form.Label>
                <Form.Control
                  as="select"
                  value={deliveryAddress.city}
                  onChange={(e) => handleAddressChange("city", e.target.value, "delivery")}
                >
                  <option value="">Selectează orașul</option>
                  {citiesByCounty(deliveryAddress.county).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            )}
  
            {/* Câmpuri obligatorii */}
            <Form.Group controlId="deliveryStreet" className="mb-3">
              <Form.Label>Strada</Form.Label>
              <Form.Control
                type="text"
                value={deliveryAddress.street}
                onChange={(e) => handleAddressChange("street", e.target.value, "delivery")}
                isInvalid={!!errors.deliveryStreet}
              />
              {errors.deliveryStreet && (
                <Form.Text className="text-danger">{errors.deliveryStreet}</Form.Text>
              )}
            </Form.Group>
  
            <Form.Group controlId="deliveryNumber" className="mb-3">
              <Form.Label>Număr</Form.Label>
              <Form.Control
                type="text"
                value={deliveryAddress.number}
                onChange={(e) => handleAddressChange("number", e.target.value, "delivery")}
                isInvalid={!!errors.deliveryNumber}
              />
              {errors.deliveryNumber && (
                <Form.Text className="text-danger">{errors.deliveryNumber}</Form.Text>
              )}
            </Form.Group>
  
            {/* Câmpuri opționale */}
            {[
              { field: "block", label: "Bloc" },
              { field: "entrance", label: "Scară" },
              { field: "apartment", label: "Apartament" },
            ].map(({ field, label }, index) => (
              <Form.Group key={index} controlId={`delivery${field}`} className="mb-3">
                <Form.Label>{label}</Form.Label>
                <Form.Control
                  type="text"
                  value={deliveryAddress[field]}
                  onChange={(e) => handleAddressChange(field, e.target.value, "delivery")}
                />
              </Form.Group>
            ))}
          </div>
        </div>
      )}
    </Form>
  );
};

  const renderStep3 = () => {
    const totalGeneral = selections.reduce((sum, selection) => {
      return sum + (selection.include && selection.selectedOption ? selection.total : 0);
    }, 0);
  
    return (
      <div>
        <h4 className="mb-4 text-center text-primary">Rezumat selecții</h4>
  
        {/* Listare piese selectate */}
        <div className="row g-3">
          {selections
            .filter((selection) => selection.include && selection.selectedOption)
            .map((selection, index) => (
              <div key={index} className="col-12 col-md-6">
                <div className="card shadow-sm">
                  <div className="card-header bg-primary text-white text-center">
                    <h5 className="m-0">{selection.partType || "Tip piesă necunoscut"}</h5>
                  </div>
                  <div className="card-body">
                    <p><strong>Producător:</strong> {selection.manufacturer || "N/A"}</p>
                    <p><strong>Cod piesă:</strong> {selection.partCode || "N/A"}</p>
                    <p><strong>Cantitate:</strong> {selection.quantity || 0} bucăți</p>
                    <p><strong>Preț/bucată fara TVA:</strong> {selection.pricePerUnit || 0} RON</p>
                    <p><strong>Termen livrare:</strong> {selection.deliveryTerm || "N/A"}</p>
                    <p className="text-success"><strong>SubTotal fara TVA:</strong> {(selection.total || 0).toFixed(2)} RON</p>
                    <p className="text-success"><strong>SubTotal cu TVA:</strong> {((selection.total || 0) * 1.21).toFixed(2)} RON</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
  
        {/* Mesaj dacă nu există selecții */}
        {selections.filter((selection) => selection.include).length === 0 && (
          <div className="alert alert-warning text-center mt-4">
            Nu există piese selectate.
          </div>
        )}
  
        {/* Total general */}
        <div className="card my-4">
          <div className="card-body text-center">
            <h5 className="text-primary">Total general fara TVA:</h5>
            <h3 className="text-success">{(totalGeneral || 0).toFixed(2)} RON</h3>
            <h5 className="text-primary">Total general cu TVA:</h5>
            <h3 className="text-success">{((totalGeneral || 0) * 1.21).toFixed(2)} RON</h3>
          </div>
        </div>
  
        {/* Adresa de facturare */}
        <div className="card mb-4">
          <div className="card-header bg-secondary text-white">
            <h5 className="m-0">Adresa de facturare</h5>
          </div>
          <div className="card-body">
            {Object.values(billingAddress).filter((field) => field).length > 0 ? (
              <ul className="list-group list-group-flush">
                {billingAddress.street && <li className="list-group-item">Stradă: {billingAddress.street}</li>}
                {billingAddress.number && <li className="list-group-item">Număr: {billingAddress.number}</li>}
                {billingAddress.block && <li className="list-group-item">Bloc: {billingAddress.block}</li>}
                {billingAddress.entrance && <li className="list-group-item">Scară: {billingAddress.entrance}</li>}
                {billingAddress.apartment && <li className="list-group-item">Apartament: {billingAddress.apartment}</li>}
                {billingAddress.city && <li className="list-group-item">Oraș: {billingAddress.city}</li>}
                {billingAddress.county && <li className="list-group-item">Judet: {billingAddress.county}</li>}
              </ul>
            ) : (
              <p className="text-danger">Adresa de facturare nu a fost specificată.</p>
            )}
          </div>
        </div>
  
        {/* Adresa de livrare */}
        <div className="card mb-4">
          <div className="card-header bg-secondary text-white">
            <h5 className="m-0">Adresa de livrare</h5>
          </div>
          <div className="card-body">
            {pickupAtCentral ? (
              <p>Ridicare de la sediu central</p>
            ) : Object.values(deliveryAddress).filter((field) => field).length > 0 ? (
              <ul className="list-group list-group-flush">
                {deliveryAddress.street && <li className="list-group-item">Stradă: {deliveryAddress.street}</li>}
                {deliveryAddress.number && <li className="list-group-item">Număr: {deliveryAddress.number}</li>}
                {deliveryAddress.block && <li className="list-group-item">Bloc: {deliveryAddress.block}</li>}
                {deliveryAddress.entrance && <li className="list-group-item">Scară: {deliveryAddress.entrance}</li>}
                {deliveryAddress.apartment && <li className="list-group-item">Apartament: {deliveryAddress.apartment}</li>}
                {deliveryAddress.city && <li className="list-group-item">Oraș: {deliveryAddress.city}</li>}
                {deliveryAddress.county && <li className="list-group-item">Județ: {deliveryAddress.county}</li>}
              </ul>
            ) : (
              <p className="text-danger">Adresa de livrare nu a fost specificată.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {readonlyMode
              ? "Vizualizare selecții ofertă"
              : `Pasul ${currentStep} - ${currentStep === 1 ? "Selectează piese" : "Adaugă detalii"}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentStep === 1 && !readonlyMode && renderStep1()}
          {currentStep === 2 && !readonlyMode && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </Modal.Body>
        <Modal.Footer>
          {!readonlyMode && currentStep > 1 && (
            <Button variant="secondary" onClick={() => setCurrentStep(currentStep - 1)}>
              Înapoi
            </Button>
          )}
          {!readonlyMode && currentStep < 3 && (
            <Button
              variant="primary"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={currentStep === 1 && !selections.some((selection) => selection.include)} // Blochează trecerea dacă nu sunt piese selectate
            >
              Înainte
            </Button>
          )}
          {currentStep === 3 && readonlyMode && (
            <Button variant="secondary" onClick={onHide}>
              Închide
            </Button>
          )}
          {currentStep === 3 && !readonlyMode && (
            <Button variant="success" onClick={handleFinalizeSelections}>
              Finalizează
            </Button>
          )}
        </Modal.Footer>
      </Modal>
  
      {/* Modal pentru Acceptare/Respingere */}
      <Modal show={showConfirmationModal} onHide={() => setShowConfirmationModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmare acțiune</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-center fs-5">
            <strong>Ești sigur că dorești să finalizezi oferta?</strong>
          </p>
          <p className="text-muted text-center">
            <small>Prin acceptare se trimite oferta spre procesare, iar respingerea o anulează.</small>
          </p>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center">
          <Button variant="success" className="px-4 py-2" onClick={handleAcceptOffer}>
            Acceptă
          </Button>
          <Button variant="danger" className="px-4 py-2" onClick={handleRejectOffer}>
            Respinge
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal pentru Editare Cantitate */}
      <Modal show={showQuantityModal} onHide={handleQuantityModalClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-edit me-2"></i>
            Editează Cantitatea
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <h5 className="text-primary">
              {quantityModalData.partType}
            </h5>
            <p className="text-muted mb-4">
              Specificați cantitatea dorită pentru această piesă
            </p>
          </div>
          
          <Form.Group className="mb-4">
            <Form.Label className="h6">
              <strong>Cantitate (bucăți):</strong>
            </Form.Label>
            <div className="d-flex align-items-center gap-3">
              <Button
                variant="outline-secondary"
                onClick={() => setNewQuantity(Math.max(1, newQuantity - 1))}
                disabled={newQuantity <= 1}
              >
                <i className="fas fa-minus"></i>
              </Button>
              
              <Form.Control
                type="number"
                min="1"
                value={newQuantity}
                onChange={(e) => {
                  const value = Math.max(1, parseInt(e.target.value) || 1);
                  setNewQuantity(value);
                }}
                className="text-center fw-bold"
                style={{ maxWidth: '100px', fontSize: '1.1rem' }}
              />
              
              <Button
                variant="outline-secondary"
                onClick={() => setNewQuantity(newQuantity + 1)}
              >
                <i className="fas fa-plus"></i>
              </Button>
            </div>
          </Form.Group>

          <div className="alert alert-info">
            <small>
              <i className="fas fa-info-circle me-2"></i>
              Cantitatea minimă este 1 bucată. Modificarea va actualiza automat prețurile.
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleQuantityModalClose}>
            Anulează
          </Button>
          <Button variant="primary" onClick={handleQuantityModalSave}>
            <i className="fas fa-save me-2"></i>
            Salvează
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
  
};

export default SelectProductsModal;
