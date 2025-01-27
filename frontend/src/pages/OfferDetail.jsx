import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useSelector } from "react-redux";
import SelectProductsModal from "./SelectProductsModal"; // Asigură-te că este importat corect
import { Container, Row, Col, Table, Button, Alert, Card, Spinner, Badge } from "react-bootstrap";

const OfferDetail = () => {
  const { offerId } = useParams();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated, authChecked, user } = useSelector((state) => state.auth);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const fetchOffer = async () => {
    if (!authChecked) {
      setError("Se verifică autentificarea...");
      return;
    }

    if (!isAuthenticated) {
      setError("Nu ești autentificat. Te rog să te loghezi.");
      setLoading(false);
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Nu ai permisiunea de a accesa oferta.");
        return;
      }
      const response = await fetchWithAuth(`http://localhost:5000/api/offer/${offerId}`);
      setOffer(response.offer);
    } catch (err) {
      setError("Nu s-a putut încărca oferta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked) {
      fetchOffer();
    }
  }, [authChecked, isAuthenticated, offerId]);

  const normalizeText = (text) => {
    if (!text) return "";
    return text
        .normalize("NFD") // Normalizează textul în formă decompusă
        .replace(/[̀-\u036f]/g, ""); // Elimină accentele diacritice
  };

  const exportSelectedToPDF = () => {
    if (!offer || !offer.selectedParts?.length) {
        setError("Oferta nu conține produse selectate pentru export.");
        return;
    }

    const doc = new jsPDF(); // Creează un document PDF
    doc.setFont("helvetica", "normal");

    // Detalii companie
    const companyDetails = normalizeText(`FURNIZOR:
  GLOBAL QUALITY SOLUTIONS SRL
  Bdul. Mărăști 25, București, Sector 1
  CUI: 17426176
  Nr reg comertului: J40/6018/2005`);

    // Detalii cumpărător
    const buyerDetails = normalizeText(
        offer.orderId?.userType === "persoana_fizica"
            ? `Nume Client: ${offer.orderId.firstName || "N/A"} ${offer.orderId.lastName || "N/A"}
  Telefon: ${offer.orderId.phoneNumber || "N/A"}
  Email: ${offer.orderId.email || "N/A"}`
            : `Firma: ${offer.orderId?.companyDetails?.companyName || "N/A"}
  CUI: ${offer.orderId?.companyDetails?.cui || "N/A"}
  Nr. Reg. Com: ${offer.orderId?.companyDetails?.nrRegCom || "N/A"}
  Telefon: ${offer.orderId.phoneNumber || "N/A"}
  Email: ${offer.orderId.email || "N/A"}`
    );

    // Adresa de facturare
    const billingAddress = normalizeText(`Adresa Facturare:
  ${offer.billingAddress?.street || "N/A"} ${offer.billingAddress?.number || ""}
  Bloc: ${offer.billingAddress?.block || "-"}, Scara: ${offer.billingAddress?.entrance || "-"}, Ap: ${offer.billingAddress?.apartment || "-"}
  ${offer.billingAddress?.city || "N/A"}, ${offer.billingAddress?.county || "N/A"}`);

    // Adresa de livrare
    const deliveryAddress = normalizeText(
        offer.pickupAtCentral
            ? "Adresa Livrare: Ridicare de la sediul central"
            : `Adresa Livrare:
  ${offer.deliveryAddress?.street || "N/A"} ${offer.deliveryAddress?.number || ""}
  Bloc: ${offer.deliveryAddress?.block || "-"}, Scara: ${offer.deliveryAddress?.entrance || "-"}, Ap: ${offer.deliveryAddress?.apartment || "-"}
  ${offer.deliveryAddress?.city || "N/A"}, ${offer.deliveryAddress?.county || "N/A"}`
    );

    // Generare PDF
    doc.setFontSize(10);

    const leftStartX = 10;
    const rightStartX = 110;
    const startY = 10;

    // Companie (stânga)
    const companyLines = doc.splitTextToSize(companyDetails, 90);
    companyLines.forEach((line, index) => {
        doc.text(line, leftStartX, startY + index * 5);
    });

    // Detalii cumpărător (dreapta)
    const clientLines = doc.splitTextToSize(buyerDetails, 90);
    clientLines.forEach((line, index) => {
        doc.text(line, rightStartX, startY + index * 5);
    });

    // Adresa facturare
    const billingLines = doc.splitTextToSize(billingAddress, 90);
    billingLines.forEach((line, index) => {
        doc.text(line, rightStartX, startY + clientLines.length * 5 + index * 5);
    });

    // Adresa livrare
    const deliveryLines = doc.splitTextToSize(deliveryAddress, 90);
    deliveryLines.forEach((line, index) => {
        doc.text(line, rightStartX, startY + (clientLines.length + billingLines.length) * 5 + index * 5);
    });

    // Titlu ofertă
    const titleText = normalizeText(`Oferta #${offer.offerNumber}`);
    const statusText = normalizeText(`Status: ${offer.status}`);
    const titleX = (doc.internal.pageSize.width - doc.getTextWidth(titleText)) / 2;
    const statusX = (doc.internal.pageSize.width - doc.getTextWidth(statusText)) / 2;
    const contentStartY =
        startY +
        Math.max(companyLines.length, clientLines.length + billingLines.length + deliveryLines.length) * 5 +
        10;

    doc.text(titleText, titleX, contentStartY);
    doc.text(statusText, statusX, contentStartY + 10);

    // Tabel piese selectate
    const tableColumn = ["Cod Piesa", "Tip", "Producator", "Pret/unitate", "Cantitate", "Total"];
    const tableRows = [];

    let totalSelectedParts = 0;

    (offer.selectedParts || []).forEach((part) => {
        const rowData = [
            normalizeText(part.partCode || "N/A"),
            normalizeText(part.partType || "N/A"),
            normalizeText(part.manufacturer || "N/A"),
            `${part.pricePerUnit} RON`,
            part.quantity || 0,
            `${part.total} RON`,
        ];
        totalSelectedParts += part.total || 0;
        tableRows.push(rowData);
    });

    doc.autoTable({
        startY: contentStartY + 20,
        head: [tableColumn],
        body: tableRows,
    });

    // Total selectii
    const totalText = normalizeText(`Total selectii: ${totalSelectedParts.toFixed(2)} RON`);
    const totalTextWidth = doc.getTextWidth(totalText);
    const totalX = doc.internal.pageSize.width - totalTextWidth - 10;

    doc.text(totalText, totalX, doc.previousAutoTable.finalY + 10);

    // Salvare PDF
    doc.save(`Oferta_${offer.offerNumber}.pdf`);
  };

  const calculateTotal = () => {
    if (offer?.selectedParts?.length > 0) {
      return offer.selectedParts.reduce((sum, part) => sum + part.total, 0);
    }
    return null;
  };

  const handleSelectProducts = () => {
    setShowSelectModal(true);
    setIsReadOnly(false);
  };

  const handleAcceptOffer = async () => {
    try {
      await fetchWithAuth(`http://localhost:5000/api/offer/${offerId}/accept`, {
        method: "POST",
      });
  
      // Actualizează manual statusul ofertei
      setOffer((prevOffer) => ({
        ...prevOffer,
        status: "oferta_acceptata", // Status actualizat
      }));
  
      alert("Oferta a fost acceptată cu succes!");
  
      // Reîncarcă oferta din backend pentru a prelua toate detaliile actualizate
      setLoading(true);
      fetchOffer().then(() => setLoading(false));
    } catch (err) {
      alert("Eroare la acceptarea ofertei: " + err.message);
    }
  };

  const handleRejectOffer = async () => {
    try {
      await fetchWithAuth(`http://localhost:5000/api/offer/${offerId}/reject`, {
        method: "POST",
      });
  
      // Actualizează manual statusul ofertei
      setOffer((prevOffer) => ({
        ...prevOffer,
        status: "oferta_respinsa", // Status actualizat
      }));
  
      alert("Oferta a fost respinsă cu succes!");
  
      // Reîncarcă oferta din backend pentru a prelua toate detaliile actualizate
      setLoading(true);
      fetchOffer().then(() => setLoading(false));
    } catch (err) {
      alert("Eroare la respingerea ofertei: " + err.message);
    }
  };

  const renderProductTable = () => (
    <Table striped bordered hover responsive className="mt-4">
      <thead>
        <tr>
          <th>#</th>
          <th>Cod Piesa</th>
          <th>Tip</th>
          <th>Producator</th>
          <th>Pret/unitate</th>
          <th>Cantitate</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {offer.parts.map((part, index) => {
          const selectedPart = offer.selectedParts.find((sp) => sp.partCode === part.partCode);
          const isSelected = !!selectedPart;

          return (
            <tr
              key={part.partCode}
              className={isSelected ? "table-success" : ""}
            >
              <td>{index + 1}</td>
              <td>{part.partCode}</td>
              <td>{part.partType}</td>
              <td>{part.manufacturer}</td>
              <td>{part.pricePerUnit} RON</td>
              <td>{part.quantity}</td>
              <td>{isSelected ? `${selectedPart.total} RON (selectat)` : `${part.pricePerUnit * part.quantity} RON`}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );

  const total = calculateTotal();

  if (loading) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container className="my-4">
      <Card className="shadow">
        <Card.Header className="bg-primary text-white">
          <h3 className="text-center">Detalii ofertă #{offer?.offerNumber}</h3>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <h5>Status: <Badge bg="info" text="dark">{offer.status}</Badge></h5>
              {total !== null ? (
                <h4>Total ofertă: <span className="text-success">{total.toFixed(2)} RON</span></h4>
              ) : (
                <Alert variant="warning" className="text-center fw-bold fs-5 border border-danger bg-light">
                  <i className="ri-error-warning-line text-danger"></i> Clientul trebuie să selecteze piesele dorite din oferta înainte de a finaliza comanda!
                </Alert>
              )}
            </Col>
            <Col md={6} className="text-md-end">
              <Button
                variant="outline-primary"
                onClick={exportSelectedToPDF}
                hidden={offer.selectedParts?.length === 0}
                className="fs-5 py-2 px-4"
              >
                <i className="ri-file-pdf-line"></i> Exportă PDF
              </Button>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={6}>
              <h5>Detalii Client:</h5>
              <p>
                {offer.orderId?.userType === "persoana_fizica"
                  ? `Nume: ${offer.orderId.firstName} ${offer.orderId.lastName}, Telefon: ${offer.orderId.phoneNumber}, Email: ${offer.orderId.email}`
                  : `Firma: ${offer.orderId.companyDetails.companyName}, CUI: ${offer.orderId.companyDetails.cui}, Nr. Reg. Com: ${offer.orderId.companyDetails.nrRegCom}, Telefon: ${offer.orderId.phoneNumber}, Email: ${offer.orderId.email}`}
              </p>
            </Col>
            <Col md={6}>
              <h5>Adresa de Facturare:</h5>
              <p>
                {offer.billingAddress
                  ? `${offer.billingAddress.street}, ${offer.billingAddress.city}, ${offer.billingAddress.county}`
                  : "Adresa de facturare nu este disponibilă - Produse Neselectate"}
              </p>
              <h5>Adresa de Livrare:</h5>
              <p>
                {offer.pickupAtCentral
                  ? "Ridicare de la sediul central"
                  : offer.deliveryAddress
                  ? `${offer.deliveryAddress.street}, ${offer.deliveryAddress.city}, ${offer.deliveryAddress.county}`
                  : "Adresa de livrare nu este disponibilă - Produse Neselectate"}
              </p>
            </Col>
          </Row>

          {renderProductTable()}

          {user?.role === "client" && (!offer.selectedParts || offer.selectedParts.length === 0) && (
            <div className="text-center my-4">
              <Button
                className="btn-lg btn-warning text-dark fw-bold py-3 px-5 border border-dark shadow-lg"
                onClick={handleSelectProducts}
              >
                <i className="ri-add-circle-line"></i> Selectează Produse
              </Button>
            </div>
          )}

          {offer.status === "comanda_spre_finalizare" && user?.role === "client" && (
            <div className="mt-4 text-center">
              <Button variant="success" className="me-2 btn-lg py-2 px-4" onClick={handleAcceptOffer}>
                <i className="ri-check-line"></i> Acceptă oferta
              </Button>
              <Button variant="danger" className="btn-lg py-2 px-4" onClick={handleRejectOffer}>
                <i className="ri-close-line"></i> Respinge oferta
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      <SelectProductsModal
        show={showSelectModal}
        onHide={() => {
          setShowSelectModal(false); // Ascunde modalul
          setLoading(true); // Reîncarcă datele
          fetchOffer().then(() => setLoading(false));
        }}
        offer={offer}
        readonlyMode={isReadOnly}
        onSaveSelection={() => {
          window.location.reload(); // Reîncarcă pagina complet
        }}
      />
    </Container>
  );
};

export default OfferDetail;
