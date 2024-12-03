import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const SelectProductsModal = ({ show, onHide, offer, onSaveSelection }) => {
  const [groupedParts, setGroupedParts] = useState([]);
  const [selections, setSelections] = useState([]);

  useEffect(() => {
    if (offer && Array.isArray(offer.parts)) {
      // Grupăm piesele după `partType`
      const grouped = {};
      offer.parts.forEach((part) => {
        if (!grouped[part.partType]) {
          grouped[part.partType] = {
            partType: part.partType,
            quantity: part.quantity,
            options: [],
          };
        }
        if (part.options && part.options.length > 0) {
          grouped[part.partType].options.push({
            optionId: part.options[0]?._id,
            manufacturer: part.manufacturer,
            price: part.pricePerUnit,
            partId: part._id,
          });
        }
      });

      const groupedPartsArray = Object.values(grouped);
      setGroupedParts(groupedPartsArray);

      // Inițializăm selecțiile
      const initialSelections = groupedPartsArray.map((group) => ({
        partType: group.partType,
        selectedOption: group.options.length === 1 ? group.options[0]?.optionId : null,
        include: group.options.length === 1,
      }));
      setSelections(initialSelections);
    }
  }, [offer]);

  const isReadOnly = offer?.status === "comanda_spre_finalizare";

  const handleSelectChange = (partType, optionId) => {
    setSelections((prevSelections) =>
      prevSelections.map((selection) =>
        selection.partType === partType
          ? { ...selection, selectedOption: optionId, include: true }
          : selection
      )
    );
  };

  const handleCheckboxChange = (partType, include) => {
    setSelections((prevSelections) =>
      prevSelections.map((selection) =>
        selection.partType === partType ? { ...selection, include } : selection
      )
    );
  };

  const handleSave = () => {
    const filteredSelections = selections.filter(
      (selection) => selection.include
    );
    onSaveSelection(filteredSelections);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {isReadOnly
            ? `Vizualizare selecții pentru oferta #${offer?.offerNumber || ""}`
            : `Selectează produse pentru oferta #${offer?.offerNumber || ""}`}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isReadOnly && offer?.selectedParts?.length > 0 ? (
          <Form>
            {offer.selectedParts.map((part, index) => (
              <div key={index} className="mb-4">
                <h5>
                  {part.partType} - Cantitate: {part.quantity}
                </h5>
                <div>
                  <Form.Check
                    type="checkbox"
                    label={`${part.manufacturer} - ${part.pricePerUnit} RON/buc.`}
                    checked={true}
                    disabled={true}
                  />
                </div>
              </div>
            ))}
          </Form>
        ) : groupedParts.length > 0 ? (
          <Form>
            {groupedParts.map((group, index) => (
              <div key={index} className="mb-4">
                <h5>
                  {group.partType} - Cantitate: {group.quantity}
                </h5>
                {group.options.length > 1 ? (
                  group.options.map((option) => (
                    <Form.Check
                      key={option.optionId}
                      type="radio"
                      label={`${option.manufacturer} - ${option.price} RON/buc.`}
                      name={`part-${group.partType}`}
                      checked={selections.some(
                        (selection) =>
                          selection.partType === group.partType &&
                          selection.selectedOption === option.optionId
                      )}
                      onChange={() =>
                        !isReadOnly &&
                        handleSelectChange(group.partType, option.optionId)
                      }
                      disabled={isReadOnly}
                    />
                  ))
                ) : (
                  group.options.length === 1 && (
                    <Form.Check
                      type="checkbox"
                      label={`${group.options[0]?.manufacturer} - ${group.options[0]?.price} RON/buc.`}
                      checked={selections.some(
                        (selection) =>
                          selection.partType === group.partType && selection.include
                      )}
                      onChange={(e) =>
                        handleCheckboxChange(group.partType, e.target.checked)
                      }
                      disabled={isReadOnly}
                    />
                  )
                )}
              </div>
            ))}
          </Form>
        ) : (
          <div className="alert alert-warning">Această ofertă nu conține piese.</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Închide
        </Button>
        {!isReadOnly && (
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={selections.some(
              (selection) => selection.include && !selection.selectedOption
            )}
          >
            Salvează selecțiile
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default SelectProductsModal;
