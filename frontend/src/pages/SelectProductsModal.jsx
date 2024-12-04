import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import locations from "../assets/locations.json";

const SelectProductsModal = ({
  show,
  onHide,
  offer,
  onSaveSelection,
  readonlyMode = false, // Prop pentru a bloca navigarea
}) => {
  const [groupedParts, setGroupedParts] = useState([]);
  const [selections, setSelections] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
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
    }
  }, [readonlyMode, offer]);
  

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

  const handleSelectChange = (partType, optionId) => {
    const selectedPart = groupedParts
      .find((group) => group.partType === partType)
      ?.options.find((option) => option.optionId === optionId);
  
    const pricePerUnit = selectedPart?.price || 0;
    const quantity = groupedParts.find((group) => group.partType === partType)?.quantity || 0;
  
    setSelections((prevSelections) =>
      prevSelections.map((selection) =>
        selection.partType === partType
          ? {
              ...selection,
              selectedOption: optionId,
              include: true,
              pricePerUnit,
              quantity,
              total: pricePerUnit * quantity,
            }
          : selection
      )
    );
  };
  
  
  const handleCheckboxChange = (partType, optionId, include) => {
    setSelections((prevSelections) =>
      prevSelections.map((selection) =>
        selection.partType === partType && selection.selectedOption === optionId
          ? {
              ...selection,
              include,
              total: include
                ? selection.pricePerUnit * selection.quantity
                : 0,
            }
          : selection
      )
    );
  };
  
  

  const handleRadioChange = (partType, optionId) => {
    setSelections((prevSelections) =>
      prevSelections.map((selection) =>
        selection.partType === partType
          ? {
              ...selection,
              selectedOption: optionId,
              include: true,
              total: selection.quantity * selection.pricePerUnit, // Total recalculat
            }
          : selection
      )
    );
  };
  
  


  const handleAddressChange = (field, value, addressType = "billing") => {
    const setAddress =
      addressType === "billing" ? setBillingAddress : setDeliveryAddress;
    const address = addressType === "billing" ? billingAddress : deliveryAddress;
    setAddress({ ...address, [field]: value });
  };

  const renderStep1 = () => {
    const totalSelectie = selections.reduce((sum, selection) => {
      return sum + (selection.include ? selection.total || 0 : 0);
    }, 0);
  
    return (
      <Form>
        {groupedParts.length > 0 ? (
          groupedParts.map((group, index) => (
            <div key={index} className="mb-4">
              <h5 className="text-primary">{group.partType}</h5>
              <div className="border rounded p-3">
                {group.options.length > 1 ? (
                  group.options.map((option) => (
                    <div
                      key={option.optionId}
                      className="d-flex justify-content-between align-items-center mb-2"
                    >
                      <Form.Check
                        type="radio"
                        label={`${option.manufacturer} - ${option.price} RON/buc`}
                        name={`part-${group.partType}`}
                        checked={selections.some(
                          (selection) =>
                            selection.partType === group.partType &&
                            selection.selectedOption === option.optionId
                        )}
                        onChange={() =>
                          handleSelectChange(group.partType, option.optionId)
                        }
                      />
                      <span className="text-muted">
                        Cantitate: {option.quantity} buc. -{" "}
                        <strong>
                          Subtotal: {option.price * option.quantity} RON
                        </strong>
                      </span>
                    </div>
                  ))
                ) : group.options.length === 1 ? (
                  <div
                    key={group.options[0].optionId}
                    className="d-flex justify-content-between align-items-center mb-2"
                  >
                    <Form.Check
                      type="checkbox"
                      label={`${group.options[0]?.manufacturer} - ${group.options[0]?.price} RON/buc`}
                      checked={selections.some(
                        (selection) =>
                          selection.partType === group.partType &&
                          selection.selectedOption ===
                            group.options[0].optionId &&
                          selection.include
                      )}
                      onChange={(e) =>
                        handleCheckboxChange(
                          group.partType,
                          group.options[0].optionId,
                          e.target.checked
                        )
                      }
                    />
                    <span className="text-muted">
                      Cantitate: {group.options[0]?.quantity} buc. -{" "}
                      <strong>
                        Subtotal:{" "}
                        {group.options[0]?.price * group.options[0]?.quantity}{" "}
                        RON
                      </strong>
                    </span>
                  </div>
                ) : (
                  <div className="text-danger">Opțiuni indisponibile.</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="alert alert-warning">Nu există piese disponibile pentru selecție.</div>
        )}
        {/* Total Selectie */}
        <div className="d-flex justify-content-end mt-4">
          <h5 className="text-primary">
            Total selecție: <span>{totalSelectie} RON</span>
          </h5>
        </div>
      </Form>
    );
  };
  
  
  

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
          onChange={() => setPickupAtCentral(true)}
        />
        <Form.Check
          type="radio"
          label="Livrare la adresa specificată"
          name="deliveryOption"
          checked={!pickupAtCentral}
          onChange={() => setPickupAtCentral(false)}
        />
      </Form.Group>
  
      {!pickupAtCentral && (
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
      return (
        sum +
        (selection.include && selection.selectedOption
          ? selection.quantity * selection.pricePerUnit
          : 0)
      );
    }, 0);
  
    console.log("Selections in Step 3:", selections);
  
    return (
      <div>
        <h5>Piese selectate:</h5>
        {selections
          .filter((selection) => selection.include && selection.selectedOption)
          .map((selection, index) => (
            <div key={index} className="mb-2">
              <strong>Tip piesă:</strong> {selection.partType || "N/A"}
              <br />
              <strong>Producător:</strong> {selection.manufacturer || "N/A"}
              <br />
              <strong>Cantitate:</strong> {selection.quantity || 0}
              <br />
              <strong>Preț/bucată:</strong>{" "}
              {selection.pricePerUnit ? `${selection.pricePerUnit} RON` : "0 RON"}
              <br />
              <strong>Total:</strong>{" "}
              {selection.total ? `${selection.total} RON` : "0 RON"}
            </div>
          ))}
        {selections.filter((selection) => selection.include).length === 0 && (
          <div className="text-danger">Nu există piese selectate.</div>
        )}
        <hr />
        <h5>Total general:</h5>
        <strong>{totalGeneral || 0} RON</strong>
  
        <hr />
        <h5>Adresa de facturare:</h5>
        {Object.values(billingAddress).filter((field) => field).length > 0 ? (
          <div>
            {billingAddress.street && <div>Stradă: {billingAddress.street}</div>}
            {billingAddress.number && <div>Număr: {billingAddress.number}</div>}
            {billingAddress.block && <div>Bloc: {billingAddress.block}</div>}
            {billingAddress.entrance && <div>Scară: {billingAddress.entrance}</div>}
            {billingAddress.apartment && <div>Apartament: {billingAddress.apartment}</div>}
            {billingAddress.city && <div>Oraș: {billingAddress.city}</div>}
            {billingAddress.county && <div>Județ: {billingAddress.county}</div>}
          </div>
        ) : (
          <div>Adresa de facturare nu a fost specificată.</div>
        )}
        <hr />
        <h5>Adresa de livrare:</h5>
        {pickupAtCentral ? (
          <div>Ridicare de la sediu central</div>
        ) : Object.values(deliveryAddress).filter((field) => field).length > 0 ? (
          <div>
            {deliveryAddress.street && <div>Stradă: {deliveryAddress.street}</div>}
            {deliveryAddress.number && <div>Număr: {deliveryAddress.number}</div>}
            {deliveryAddress.block && <div>Bloc: {deliveryAddress.block}</div>}
            {deliveryAddress.entrance && <div>Scară: {deliveryAddress.entrance}</div>}
            {deliveryAddress.apartment && <div>Apartament: {deliveryAddress.apartment}</div>}
            {deliveryAddress.city && <div>Oraș: {deliveryAddress.city}</div>}
            {deliveryAddress.county && <div>Județ: {deliveryAddress.county}</div>}
          </div>
        ) : (
          <div>Adresa de livrare nu a fost specificată.</div>
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
        {currentStep === 3 && !readonlyMode && (
          <Button
            variant="success"
            onClick={() =>
              onSaveSelection({
                selectedParts: selections.filter(
                  (selection) => selection.include && selection.selectedOption
                ),
                billingAddress,
                deliveryAddress: pickupAtCentral ? null : deliveryAddress,
                pickupAtCentral,
              })
            }
          >
            Finalizează
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default SelectProductsModal;
