// EditProductsModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Card, Badge, InputGroup } from "react-bootstrap";
import { fetchWithAuth } from "../../utils/fetchWithAuth";
import { toast } from "react-toastify";

/** Custom inline notice (in loc de alert-ul Bootstrap clasic) */
const InlineNotice = ({ variant = "danger", title, message, onClose }) => {
  const icon =
    variant === "danger"
      ? "bi bi-exclamation-octagon-fill"
      : variant === "warning"
      ? "bi bi-exclamation-triangle-fill"
      : "bi bi-info-circle-fill";

  const bg =
    variant === "danger"
      ? { background: "rgba(220, 53, 69, 0.08)", borderColor: "rgba(220, 53, 69, 0.25)" }
      : variant === "warning"
      ? { background: "rgba(255, 193, 7, 0.12)", borderColor: "rgba(255, 193, 7, 0.35)" }
      : { background: "rgba(13, 110, 253, 0.08)", borderColor: "rgba(13, 110, 253, 0.25)" };

  const color =
    variant === "danger"
      ? "var(--bs-danger)"
      : variant === "warning"
      ? "var(--bs-warning)"
      : "var(--bs-primary)";

  return (
    <div
      className="p-3 rounded-4 border shadow-sm mb-4 d-flex gap-3 align-items-start"
      style={bg}
      role="alert"
    >
      <div style={{ color, fontSize: 18, marginTop: 2 }}>
        <i className={icon}></i>
      </div>

      <div className="flex-grow-1">
        <div className="fw-semibold">{title}</div>
        <div className="small text-muted">{message}</div>
      </div>

      {onClose && (
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
          <i className="bi bi-x-lg"></i>
        </button>
      )}
    </div>
  );
};

const EditProductsModal = ({ show, onHide, offer, onUpdate }) => {
  const [parts, setParts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Unsaved changes protection
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState("[]");

  const canEdit = ["proiect", "trimisa"].includes(offer?.status);
  const statusVariant = canEdit ? "success" : "secondary";

  const normalizeParts = (arr) =>
    (arr || []).map((p) => ({
      _id: p?._id ? String(p._id) : null,
      partCode: (p.partCode || "").trim(),
      partType: (p.partType || "").trim(),
      manufacturer: (p.manufacturer || "").trim(),
      deliveryTerm: (p.deliveryTerm || "").trim(),
      pricePerUnit: Number(p.pricePerUnit) || 0,
      quantity: Number(p.quantity) || 0,
    }));

  const isDirty = useMemo(() => {
    return JSON.stringify(normalizeParts(parts)) !== initialSnapshot;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parts, initialSnapshot]);

  const grandTotal = useMemo(() => {
    return parts.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  }, [parts]);

  // Init modal state on open
  useEffect(() => {
    if (!show || !offer) return;

    const mapped = (offer.parts || []).map((part) => ({
      ...part,
      total: part.pricePerUnit * part.quantity,
    }));

    setParts(mapped);
    setInitialSnapshot(JSON.stringify(normalizeParts(mapped)));

    // status check
    if (!["proiect", "trimisa"].includes(offer.status)) {
      setError(`Oferta nu poate fi editata in statusul curent (${offer.status}).`);
    } else {
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, offer]);

  const handleFieldChange = (index, field, value) => {
    const updatedParts = [...parts];
    updatedParts[index] = {
      ...updatedParts[index],
      [field]: value,
    };

    if (field === "pricePerUnit" || field === "quantity") {
      updatedParts[index].total = updatedParts[index].pricePerUnit * updatedParts[index].quantity;
    }

    setParts(updatedParts);
  };

  const handleRemovePart = (index) => {
    const ok = window.confirm("Sigur vrei sa stergi acest produs din oferta?");
    if (!ok) return;
    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  const validateParts = () => {
    for (const part of parts) {
      if (!part.partCode || !part.partType || !part.manufacturer || !part.deliveryTerm || !part.pricePerUnit || !part.quantity) {
        setError("Toate campurile sunt obligatorii pentru fiecare produs.");
        return false;
      }
      if (part.pricePerUnit <= 0 || part.quantity <= 0) {
        setError("Pretul si cantitatea trebuie sa fie valori pozitive.");
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateParts()) return;

    try {
      setLoading(true);
      setError("");

      const data = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/offer/admin/${offer._id}/update-products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: parts.map((part) => ({
            partCode: part.partCode,
            partType: part.partType,
            manufacturer: part.manufacturer,
            pricePerUnit: parseFloat(part.pricePerUnit),
            quantity: parseInt(part.quantity, 10),
            deliveryTerm: part.deliveryTerm,
            _id: part._id,
          })),
        }),
      });

      if (data.success) {
        toast.success("Produsele au fost actualizate cu succes!");
        // reset dirty snapshot (optional, useful daca nu inchizi imediat)
        setInitialSnapshot(JSON.stringify(normalizeParts(parts)));

        setShowUnsavedModal(false);
        onUpdate();
        onHide(); // inchide fara prompt (e deja salvat)
      } else {
        const errorMessage = data.message || "Eroare la actualizarea produselor";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err.message || "Eroare la actualizarea produselor";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Eroare:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClose = () => {
    if (loading) return;

    // daca are modificari nesalvate, cerem confirmare
    if (isDirty) {
      setShowUnsavedModal(true);
      return;
    }
    onHide();
  };

  return (
    <>
      <Modal
        show={show}
        onHide={handleRequestClose}
        size="lg"
        centered
        scrollable
        fullscreen="sm-down"
        dialogClassName="edit-products-modal"
        contentClassName="border-0 rounded-4 shadow"
        backdrop="static"
        keyboard={!loading}
      >
        <Modal.Header className="bg-body-tertiary border-0" closeButton>
          <div className="w-100 d-flex align-items-start justify-content-between gap-3">
            <div>
              <Modal.Title className="fw-bold">
                Editare produse <span className="text-muted">#{offer?.offerNumber}</span>
              </Modal.Title>

              <div className="d-flex gap-2 mt-2 flex-wrap">
                <Badge bg={statusVariant} className="text-uppercase">
                  {offer?.status}
                </Badge>
                <Badge bg="dark">{parts.length} produse</Badge>
                {isDirty && (
                  <Badge bg="warning" text="dark">
                    Nesalvat
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-end">
              <div className="small text-muted">Total oferta</div>
              <div className="fs-5 fw-bold">{grandTotal.toFixed(2)} RON</div>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="bg-light">
          {error && (
            <InlineNotice
              variant="danger"
              title="A aparut o problema"
              message={error}
              onClose={() => setError("")}
            />
          )}

          {parts.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-2">
                <i className="bi bi-box-seam fs-1 text-muted"></i>
              </div>
              <div className="fw-semibold">Nu mai exista produse in oferta</div>
              <div className="text-muted small">
                Adauga produse din ecranul de “Add products” sau pastreaza cel putin un produs aici.
              </div>
            </div>
          ) : (
            <Form>
              {parts.map((part, index) => (
                <Card key={part._id || index} className="border-0 rounded-4 shadow-sm mb-3">
                  <Card.Header className="bg-white border-0 rounded-top-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold">Produs #{index + 1}</span>
                        <Badge bg="light" text="dark" className="border">
                          Total: {(Number(part.total) || 0).toFixed(2)} RON
                        </Badge>
                      </div>

                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="d-flex align-items-center gap-2"
                        onClick={() => handleRemovePart(index)}
                        disabled={loading || !canEdit}
                      >
                        <i className="bi bi-trash3"></i>
                        Sterge
                      </Button>
                    </div>
                  </Card.Header>

                  <Card.Body className="pt-3">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="small text-muted">Cod piesa</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              <i className="bi bi-upc-scan"></i>
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              value={part.partCode}
                              onChange={(e) => handleFieldChange(index, "partCode", e.target.value)}
                              isInvalid={!part.partCode}
                              placeholder="ex: 04465-0W090"
                              disabled={!canEdit || loading}
                            />
                          </InputGroup>
                          <Form.Control.Feedback type="invalid">Codul piesei este obligatoriu</Form.Control.Feedback>
                        </Form.Group>
                      </div>

                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="small text-muted">Tip piesa</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              <i className="bi bi-tags"></i>
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              value={part.partType}
                              onChange={(e) => handleFieldChange(index, "partType", e.target.value)}
                              isInvalid={!part.partType}
                              placeholder="ex: disc frana"
                              disabled={!canEdit || loading}
                            />
                          </InputGroup>
                          <Form.Control.Feedback type="invalid">Tipul piesei este obligatoriu</Form.Control.Feedback>
                        </Form.Group>
                      </div>

                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="small text-muted">Producator</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              <i className="bi bi-building"></i>
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              value={part.manufacturer}
                              onChange={(e) => handleFieldChange(index, "manufacturer", e.target.value)}
                              isInvalid={!part.manufacturer}
                              placeholder="ex: ATE / Bosch"
                              disabled={!canEdit || loading}
                            />
                          </InputGroup>
                          <Form.Control.Feedback type="invalid">Producatorul este obligatoriu</Form.Control.Feedback>
                        </Form.Group>
                      </div>

                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="small text-muted">Pret/unitate</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              <i className="bi bi-cash-coin"></i>
                            </InputGroup.Text>
                            <Form.Control
                              type="number"
                              value={part.pricePerUnit}
                              onChange={(e) => handleFieldChange(index, "pricePerUnit", parseFloat(e.target.value))}
                              isInvalid={part.pricePerUnit <= 0}
                              min="0.01"
                              step="0.01"
                              disabled={!canEdit || loading}
                            />
                            <InputGroup.Text>RON</InputGroup.Text>
                          </InputGroup>
                          <Form.Control.Feedback type="invalid">Pretul trebuie sa fie pozitiv</Form.Control.Feedback>
                        </Form.Group>
                      </div>

                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="small text-muted">Cantitate</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              <i className="bi bi-123"></i>
                            </InputGroup.Text>
                            <Form.Control
                              type="number"
                              value={part.quantity}
                              onChange={(e) => handleFieldChange(index, "quantity", parseInt(e.target.value, 10))}
                              isInvalid={part.quantity <= 0}
                              min="1"
                              disabled={!canEdit || loading}
                            />
                          </InputGroup>
                          <Form.Control.Feedback type="invalid">Cantitatea trebuie sa fie cel putin 1</Form.Control.Feedback>
                        </Form.Group>
                      </div>

                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="small text-muted">Termen livrare</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              <i className="bi bi-truck"></i>
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              value={part.deliveryTerm}
                              onChange={(e) => handleFieldChange(index, "deliveryTerm", e.target.value)}
                              isInvalid={!part.deliveryTerm}
                              placeholder="ex: 3-5 zile"
                              disabled={!canEdit || loading}
                            />
                          </InputGroup>
                          <Form.Control.Feedback type="invalid">Termenul de livrare este obligatoriu</Form.Control.Feedback>
                        </Form.Group>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer className="bg-white border-0">
          <Button variant="outline-secondary" onClick={handleRequestClose} disabled={loading}>
            Inchide
          </Button>

          <Button
            variant="primary"
            className="px-4"
            onClick={handleSave}
            disabled={loading || parts.length === 0 || !canEdit}
          >
            {loading ? "Se salveaza..." : "Salveaza modificarile"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirm pentru modificari nesalvate */}
      <Modal
        show={showUnsavedModal}
        onHide={() => setShowUnsavedModal(false)}
        centered
        backdrop="static"
        keyboard={false}
        contentClassName="border-0 rounded-4 shadow"
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Modificari nesalvate</Modal.Title>
        </Modal.Header>

        <Modal.Body className="pt-0">
          <div className="d-flex gap-3 align-items-start">
            <div className="text-warning fs-4">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div>
              <div className="fw-semibold">Ai modificari care nu au fost salvate.</div>
              <div className="text-muted small">
                Vrei sa salvezi inainte sa inchizi? Daca renunti, modificarile se pierd.
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={() => setShowUnsavedModal(false)}>
            Continua editarea
          </Button>

          <Button
            variant="outline-danger"
            onClick={() => {
              setShowUnsavedModal(false);
              setError("");
              onHide(); // inchide fara save (modificarile se pierd)
            }}
          >
            Renunta la modificari
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setShowUnsavedModal(false);
              handleSave();
            }}
            disabled={loading || parts.length === 0 || !canEdit}
          >
            Salveaza
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditProductsModal;