import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import locations from "../assets/locations.json";

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

  const handleRadioChange = (partType, optionId) => {
    setSelections((prevSelections) =>
      prevSelections.map((selection) => {
        if (selection.partType === partType) {
          return {
            ...selection,
            include: selection.selectedOption === optionId, // Include doar opțiunea selectată
            total: selection.selectedOption === optionId ? selection.pricePerUnit * selection.quantity : 0,
          };
        }
        return selection;
      })
    );
  };


  const handleSelectChange = (partType, optionId) => {
    setSelections((prevSelections) =>
      prevSelections.map((selection) => {
        if (selection.partType === partType) {
          const group = groupedParts.find((g) => g.partType === partType);
          const option = group?.options.find((o) => o.optionId === optionId);
  
          if (option) {
            return {
              ...selection,
              selectedOption: optionId,
              include: true,
              manufacturer: option.manufacturer,
              pricePerUnit: option.price,
              quantity: option.quantity,
              total: option.price * option.quantity,
            };
          }
        }
        return selection;
      })
    );
  };
  
  
  
  
  
  
  
  
  const handleCheckboxChange = (partType, optionId, checked) => {
    setSelections((prevSelections) =>
      prevSelections.map((selection) => {
        if (selection.partType === partType && selection.selectedOption === optionId) {
          return {
            ...selection,
            include: checked,
            total: checked ? selection.pricePerUnit * selection.quantity : 0,
          };
        }
        return selection;
      })
    );
  };
  
  
  


  const handleAddressChange = (field, value, addressType = "billing") => {
    const setAddress =
      addressType === "billing" ? setBillingAddress : setDeliveryAddress;
    const address = addressType === "billing" ? billingAddress : deliveryAddress;
    setAddress({ ...address, [field]: value });
  };

  const handleFinalizeSelections = () => {
    onSaveSelection({
      selectedParts: selections.filter(
        (selection) => selection.include && selection.selectedOption
      ),
      billingAddress,
      deliveryAddress: pickupAtCentral ? null : deliveryAddress,
      pickupAtCentral,
    });
    setShowDecisionButtons(true); // Afișează butoanele "Acceptă" și "Respinge"
  };
  

  const handleAcceptOffer = () => {
    onAcceptOffer(offer._id);
    setShowDecisionButtons(false); // Ascunde butoanele după acceptare
  };
  
  const handleRejectOffer = () => {
    onRejectOffer(offer._id);
    setShowDecisionButtons(false); // Ascunde butoanele după respingere
  };

  useEffect(() => {
  if (offer && offer.status === "comanda_spre_finalizare") {
    setShowDecisionButtons(true);
  } else {
    setShowDecisionButtons(false);
  }
}, [offer]);

  

  
  
  const renderStep1 = () => (
    <Form>
      {groupedParts.length > 0 ? (
        groupedParts.map((group, index) => (
          <div key={index} className="mb-4">
            <h5 className="text-primary">{group.partType}</h5>
            <div className="border rounded p-3">
              {group.options.length > 1 ? (
                group.options.map((option) => (
                  <div key={option.optionId} className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Check
                      type="radio"
                      label={`${option.manufacturer} - ${option.price} RON/buc`}
                      name={`part-${group.partType}`}
                      checked={selections.some(
                        (selection) =>
                          selection.partType === group.partType &&
                          selection.selectedOption === option.optionId &&
                          selection.include
                      )}
                      onChange={() => handleRadioChange(group.partType, option.optionId)}
                    />
                    <span className="text-muted">
                      Cantitate: {option.quantity} buc. -{" "}
                      <strong>Subtotal: {option.price * option.quantity} RON</strong>
                    </span>
                  </div>
                ))
              ) : (
                <div
                  key={group.options[0]?.optionId}
                  className="d-flex justify-content-between align-items-center mb-2"
                >
                  <Form.Check
                    type="checkbox"
                    label={`${group.options[0]?.manufacturer} - ${group.options[0]?.price} RON/buc`}
                    checked={selections.some(
                      (selection) =>
                        selection.partType === group.partType &&
                        selection.selectedOption === group.options[0]?.optionId &&
                        selection.include
                    )}
                    onChange={(e) =>
                      handleCheckboxChange(
                        group.partType,
                        group.options[0]?.optionId,
                        e.target.checked
                      )
                    }
                  />
                  <span className="text-muted">
                    Cantitate: {group.options[0]?.quantity || 0} buc. -{" "}
                    <strong>
                      Subtotal: {group.options[0]?.price * (group.options[0]?.quantity || 0)} RON
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="alert alert-warning">Nu există piese disponibile pentru selecție.</div>
      )}
      <div className="d-flex justify-content-end mt-4">
        <h5 className="text-primary">Total selecție: {totalSelectie} RON</h5>
      </div>
    </Form>
  );
  
  
  
  
  
  
  

  const renderStep2 = () => (
    <Form>
      <h5>Adresa de facturare</h5>
      <Form.Group controlId="billingCounty">
        <Form.Label>Județ</Form.Label>
        <Form.Control
          as="select"
          value={billingAddress.county}
          onChange={(e) => handleAddressChange("county", e.target.value, "billing")}
        >
          <option value="">Selectează județul</option>
          {counties.map((county) => (
            <option key={county} value={county}>
              {county}
            </option>
          ))}
        </Form.Control>
      </Form.Group>
      {billingAddress.county && (
        <Form.Group controlId="billingCity">
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
        </Form.Group>
      )}
      {/* Adresa detaliată */}
      <Form.Group controlId="billingStreet">
        <Form.Label>Stradă</Form.Label>
        <Form.Control
          type="text"
          value={billingAddress.street}
          onChange={(e) => handleAddressChange("street", e.target.value, "billing")}
        />
      </Form.Group>
      <Form.Group controlId="billingNumber">
        <Form.Label>Număr</Form.Label>
        <Form.Control
          type="text"
          value={billingAddress.number}
          onChange={(e) => handleAddressChange("number", e.target.value, "billing")}
        />
      </Form.Group>
      <Form.Group controlId="billingBlock">
        <Form.Label>Bloc</Form.Label>
        <Form.Control
          type="text"
          value={billingAddress.block}
          onChange={(e) => handleAddressChange("block", e.target.value, "billing")}
        />
      </Form.Group>
      <Form.Group controlId="billingEntrance">
        <Form.Label>Scară</Form.Label>
        <Form.Control
          type="text"
          value={billingAddress.entrance}
          onChange={(e) => handleAddressChange("entrance", e.target.value, "billing")}
        />
      </Form.Group>
      <Form.Group controlId="billingApartment">
        <Form.Label>Apartament</Form.Label>
        <Form.Control
          type="text"
          value={billingAddress.apartment}
          onChange={(e) => handleAddressChange("apartment", e.target.value, "billing")}
        />
      </Form.Group>
  
      <h5>Opțiuni de livrare</h5>
      <Form.Group>
      <Form.Check
        type="radio"
        label="Ridicare produse de la sediu central"
        name="deliveryOption"
        checked={pickupAtCentral}
        onChange={() => {
          setPickupAtCentral(true);
          setIsDeliverySame(false); // Resetează opțiunea de copiere
        }}
      />
        <Form.Check
          type="radio"
          label="Livrare la adresa specificată"
          name="deliveryOption"
          checked={!pickupAtCentral && !isDeliverySame}
          onChange={() => {
            setPickupAtCentral(false);
            setIsDeliverySame(false); // Dezactivează opțiunea de copiere
          }}
        />
      <Form.Check
          type="radio"
          label="Adresa de livrare este aceeași cu adresa de facturare"
          name="deliveryOption"
          checked={isDeliverySame}
          onChange={() => {
            setPickupAtCentral(false);
            setIsDeliverySame(true);
            setDeliveryAddress(billingAddress); // Copiază datele de facturare în livrare
          }}
        />
      </Form.Group>
  
      {!pickupAtCentral && !isDeliverySame && (
        <>
          <h5>Adresa de livrare</h5>
          <Form.Group controlId="deliveryCounty">
            <Form.Label>Județ</Form.Label>
            <Form.Control
              as="select"
              value={deliveryAddress.county}
              onChange={(e) => handleAddressChange("county", e.target.value, "delivery")}
            >
              <option value="">Selectează județul</option>
              {counties.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          {deliveryAddress.county && (
            <Form.Group controlId="deliveryCity">
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
          <Form.Group controlId="deliveryStreet">
            <Form.Label>Stradă</Form.Label>
            <Form.Control
              type="text"
              value={deliveryAddress.street}
              onChange={(e) => handleAddressChange("street", e.target.value, "delivery")}
            />
          </Form.Group>
          <Form.Group controlId="deliveryNumber">
            <Form.Label>Număr</Form.Label>
            <Form.Control
              type="text"
              value={deliveryAddress.number}
              onChange={(e) => handleAddressChange("number", e.target.value, "delivery")}
            />
          </Form.Group>
          <Form.Group controlId="deliveryBlock">
            <Form.Label>Bloc</Form.Label>
            <Form.Control
              type="text"
              value={deliveryAddress.block}
              onChange={(e) => handleAddressChange("block", e.target.value, "delivery")}
            />
          </Form.Group>
          <Form.Group controlId="deliveryEntrance">
            <Form.Label>Scară</Form.Label>
            <Form.Control
              type="text"
              value={deliveryAddress.entrance}
              onChange={(e) => handleAddressChange("entrance", e.target.value, "delivery")}
            />
          </Form.Group>
          <Form.Group controlId="deliveryApartment">
            <Form.Label>Apartament</Form.Label>
            <Form.Control
              type="text"
              value={deliveryAddress.apartment}
              onChange={(e) => handleAddressChange("apartment", e.target.value, "delivery")}
            />
          </Form.Group>
        </>
      )}
    </Form>
  );

  const renderStep3 = () => {
    const totalGeneral = selections.reduce((sum, selection) => {
      return sum + (selection.include && selection.selectedOption ? selection.total : 0);
    }, 0);
  
    return (
      <div>
        <h5 className="mb-3">Rezumat selecții:</h5>
  
        {/* Listare piese selectate */}
        {selections
          .filter((selection) => selection.include && selection.selectedOption)
          .map((selection, index) => (
            <div key={index} className="mb-3">
              <p>
                <strong>Tip piesă:</strong> {selection.partType || "N/A"}
              </p>
              <p>
                <strong>Producător:</strong>{" "}
                {selection.manufacturer || "N/A"}
              </p>
              <p>
                <strong>Cantitate:</strong> {selection.quantity || 0}
              </p>
              <p>
                <strong>Preț/bucată:</strong>{" "}
                {selection.pricePerUnit || 0} RON
              </p>
              <p>
                <strong>Total:</strong> {selection.total || 0} RON
              </p>
              <hr />
            </div>
          ))}
  
        {/* Mesaj dacă nu există selecții */}
        {selections.filter((selection) => selection.include).length === 0 && (
          <div className="text-danger mb-3">
            Nu există piese selectate.
          </div>
        )}
  
        {/* Total general */}
        <div className="mb-4">
          <h5 className="text-primary">Total general:</h5>
          <p><strong>{totalGeneral || 0} RON</strong></p>
        </div>
  
        {/* Adresa de facturare */}
        <div className="mb-4">
          <h5 className="text-primary">Adresa de facturare:</h5>
          {Object.values(billingAddress).filter((field) => field).length > 0 ? (
            <div>
              {billingAddress.street && <p>Stradă: {billingAddress.street}</p>}
              {billingAddress.number && <p>Număr: {billingAddress.number}</p>}
              {billingAddress.block && <p>Bloc: {billingAddress.block}</p>}
              {billingAddress.entrance && <p>Scară: {billingAddress.entrance}</p>}
              {billingAddress.apartment && <p>Apartament: {billingAddress.apartment}</p>}
              {billingAddress.city && <p>Oraș: {billingAddress.city}</p>}
              {billingAddress.county && <p>Județ: {billingAddress.county}</p>}
            </div>
          ) : (
            <p className="text-danger">Adresa de facturare nu a fost specificată.</p>
          )}
        </div>
  
        {/* Adresa de livrare */}
        <div className="mb-4">
          <h5 className="text-primary">Adresa de livrare:</h5>
          {pickupAtCentral ? (
            <p>Ridicare de la sediu central</p>
          ) : Object.values(deliveryAddress).filter((field) => field).length > 0 ? (
            <div>
              {deliveryAddress.street && <p>Stradă: {deliveryAddress.street}</p>}
              {deliveryAddress.number && <p>Număr: {deliveryAddress.number}</p>}
              {deliveryAddress.block && <p>Bloc: {deliveryAddress.block}</p>}
              {deliveryAddress.entrance && <p>Scară: {deliveryAddress.entrance}</p>}
              {deliveryAddress.apartment && <p>Apartament: {deliveryAddress.apartment}</p>}
              {deliveryAddress.city && <p>Oraș: {deliveryAddress.city}</p>}
              {deliveryAddress.county && <p>Județ: {deliveryAddress.county}</p>}
            </div>
          ) : (
            <p className="text-danger">Adresa de livrare nu a fost specificată.</p>
          )}
        </div>
  
        {/* Butoane pentru Acceptare/Respingere */}
        {showDecisionButtons && (
          <div className="d-flex justify-content-end">
            <Button
              variant="success"
              onClick={handleAcceptOffer}
              className="me-2"
            >
              Acceptă
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectOffer}
            >
              Respinge
            </Button>
          </div>
        )}
      </div>
    );
  };

  
  
  
  
  

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
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
          <Button variant="primary" onClick={() => setCurrentStep(currentStep + 1)}>
            Înainte
          </Button>
        )}
        {currentStep === 3 && readonlyMode && (
          <Button variant="secondary" onClick={onHide}>
            Închide
          </Button>
        )}
        {currentStep === 3 && !readonlyMode && !showDecisionButtons && (
          <Button variant="success" onClick={handleFinalizeSelections}>
            Finalizează
          </Button>
)}

      </Modal.Footer>
    </Modal>
  );
};

export default SelectProductsModal;
