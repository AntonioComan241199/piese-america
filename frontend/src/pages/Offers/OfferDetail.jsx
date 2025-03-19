import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { fetchWithAuth } from "../../utils/fetchWithAuth";
import { useSelector } from "react-redux";
import SelectProductsModal from "../Modals/SelectProductsModal"; // Asigură-te că este importat corect
import { Container, Row, Col, Table, Button, Alert, Card, Spinner, Badge } from "react-bootstrap";
import EditProductsModal from '../Modals/EditProductsModal';
const API_URL = import.meta.env.VITE_API_URL;
import "../../styles/OfferDetail.css";
import AddProductsModal from '../Modals/AddProductsModal';



const OfferDetail = () => {
  const { offerId } = useParams();
  const { isAuthenticated, authChecked, user } = useSelector((state) => state.auth);

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Noul state pentru modal-ul de editare
  const [showAddModal, setShowAddModal] = useState(false);
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
      const response = await fetchWithAuth(`${API_URL}/offer/${offerId}`);
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
    const contentStartY = startY + 60;

    doc.text(titleText, titleX, contentStartY);
    doc.text(statusText, statusX, contentStartY + 10);

    // Definire coloană tabel
    const tableColumn = [
        "Cod Piesa",
        "Tip",
        "Producator",
        "Pret unitar",
        "Cantitate",
        "Valoare fara TVA",
        "TVA (19%)",
        "Valoare cu TVA",
    ];
    const tableRows = [];

    let totalFaraTVA = 0;
    let totalTVA = 0;
    let totalCuTVA = 0;

    (offer.selectedParts || []).forEach((part) => {
        const subtotalFaraTVA = part.pricePerUnit * part.quantity;
        const tva = subtotalFaraTVA * 0.19;
        const subtotalCuTVA = subtotalFaraTVA + tva;

        totalFaraTVA += subtotalFaraTVA;
        totalTVA += tva;
        totalCuTVA += subtotalCuTVA;

        const rowData = [
            normalizeText(part.partCode || "N/A"),
            normalizeText(part.partType || "N/A"),
            normalizeText(part.manufacturer || "N/A"),
            `${part.pricePerUnit.toFixed(2)} RON`,
            part.quantity || 0,
            `${subtotalFaraTVA.toFixed(2)} RON`,
            `${tva.toFixed(2)} RON`,
            `${subtotalCuTVA.toFixed(2)} RON`,
        ];
        tableRows.push(rowData);
    });

    doc.autoTable({
        startY: contentStartY + 20,
        head: [tableColumn],
        body: tableRows,
    });

    // Totaluri
    const totalText = normalizeText(`Total fără TVA: ${totalFaraTVA.toFixed(2)} RON`);
    const tvaText = normalizeText(`TVA (19%): ${totalTVA.toFixed(2)} RON`);
    const totalCuTVAText = normalizeText(`Total cu TVA: ${totalCuTVA.toFixed(2)} RON`);

    const totalX = doc.internal.pageSize.width - doc.getTextWidth(totalText) - 10;

    doc.text(totalText, totalX, doc.previousAutoTable.finalY + 10);
    doc.text(tvaText, totalX, doc.previousAutoTable.finalY + 20);
    doc.text(totalCuTVAText, totalX, doc.previousAutoTable.finalY + 30);

    // Salvare PDF
    doc.save(`Oferta_${offer.offerNumber}.pdf`);
};

  const calculateTotal = () => {
    if (!offer?.selectedParts?.length) return null;
  
    const totalFaraTVA = offer.selectedParts.reduce((sum, part) => sum + (part.pricePerUnit * part.quantity), 0);
    const totalTVA = totalFaraTVA * 0.19;
    const totalCuTVA = totalFaraTVA + totalTVA;
  
    return { totalFaraTVA, totalTVA, totalCuTVA };
  };

  const handleSelectProducts = () => {
    setShowSelectModal(true);
    setIsReadOnly(false);
  };

  const handleAcceptOffer = async () => {
    try {
      await fetchWithAuth(`${API_URL}/offer/${offerId}/accept`, {
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
      await fetchWithAuth(`${API_URL}/offer/${offerId}/reject`, {
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
  
    const renderProductTable = () => {
      return (
        <div className="table-container">
          {offer.parts.map((part, index) => {
            const selectedPart = offer.selectedParts.find((sp) => sp.partCode === part.partCode);
            const isSelected = !!selectedPart;
            const subtotalFaraTVA = part.pricePerUnit * part.quantity;
            const tva = subtotalFaraTVA * 0.19;
            const subtotalCuTVA = subtotalFaraTVA + tva;
  
            return (
              <div
                key={part.partCode}
                className={`mb-1 rounded overflow-hidden ${
                  isSelected ? 'border border-success' : 'border'
                }`}
                style={{
                  backgroundColor: '#fff',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Header */}
                <div
                  className={`px-3 py-2 ${
                    isSelected ? 'bg-success bg-gradient text-white' : 'bg-light'
                  }`}
                  style={{
                    borderBottom: '1px solid rgba(0,0,0,0.1)'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold">
                      <i className="ri-shopping-cart-2-line me-2"></i>
                      Produs #{index + 1}
                    </h6>
                    {isSelected && (
                      <span className="badge bg-white text-success px-2 py-1 rounded-pill">
                        <i className="ri-check-line me-1"></i>
                        Selectat
                      </span>
                    )}
                  </div>
                </div>
  
                {/* Product Details */}
                <div className="p-1">
                  <div className="row g-1">
                    {[
                      {
                        icon: 'ri-barcode-line',
                        label: 'Cod Piesă',
                        value: part.partCode,
                        valueClass: 'fw-bold'
                      },
                      {
                        icon: 'ri-tools-line',
                        label: 'Tip',
                        value: part.partType
                      },
                      {
                        icon: 'ri-building-line',
                        label: 'Producător',
                        value: part.manufacturer
                      },
                      {
                        icon: 'ri-money-euro-circle-line',
                        label: 'Preț unitar',
                        value: `${part.pricePerUnit.toFixed(2)} RON`,
                        valueClass: 'text-primary'
                      },
                      {
                        icon: 'ri-numbers-line',
                        label: 'Cantitate',
                        value: part.quantity
                      },
                      {
                        icon: 'ri-calculator-line',
                        label: 'Valoare fără TVA',
                        value: `${subtotalFaraTVA.toFixed(2)} RON`,
                        valueClass: 'text-success'
                      },
                      {
                        icon: 'ri-percent-line',
                        label: 'TVA (19%)',
                        value: `${tva.toFixed(2)} RON`,
                        valueClass: 'text-danger'
                      },
                      {
                        icon: 'ri-money-euro-box-line',
                        label: 'Valoare cu TVA',
                        value: isSelected
                          ? `${(selectedPart.pricePerUnit * selectedPart.quantity * 1.19).toFixed(2)} RON`
                          : `${subtotalCuTVA.toFixed(2)} RON`,
                        valueClass: 'fw-bold'
                      },
                      {
                        icon: 'ri-time-line',
                        label: 'Termen livrare',
                        value: part.deliveryTerm
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="col-12">
                        <div className="d-flex flex-column flex-sm-row align-items-sm-center py-0 px-2 rounded"
                             style={{
                               backgroundColor: isSelected ? 'rgba(25, 135, 84, 0.03)' : 'rgba(0,0,0,0.02)',
                               transition: 'all 0.3s ease'
                             }}>
                          <div className="text-muted mb-0 mb-sm-0 me-sm-3" style={{minWidth: '120px'}}>
                            <i className={`${item.icon} me-2`}></i>
                            {item.label}
                          </div>
                          <div className={item.valueClass || ''}>
                            {item.value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    };

  const total = calculateTotal();

  if (loading) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  
  const handleProductsUpdate = () => {
    setLoading(true);
    fetchOffer().then(() => setLoading(false));
  };


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
                  <div>
                  <h4>Total ofertă fără TVA: <span className="text-primary">{total.totalFaraTVA.toFixed(2)} RON</span></h4>
                  <h4>TVA (19%): <span className="text-danger">{total.totalTVA.toFixed(2)} RON</span></h4>
                  <h4>Total ofertă cu TVA: <span className="text-success">{total.totalCuTVA.toFixed(2)} RON</span></h4>
                </div>
              ) : (
                <Alert variant="warning" className="text-center fw-bold fs-5 border border-danger bg-light">
                  <i className="ri-error-warning-line text-danger"></i> Clientul trebuie să selecteze piesele dorite din ofertă înainte de a finaliza comanda!
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
                  ? [
                      offer.billingAddress.street ? `Strada ${offer.billingAddress.street}` : null,
                      offer.billingAddress.number ? `Nr. ${offer.billingAddress.number}` : null,
                      offer.billingAddress.block ? `Bloc ${offer.billingAddress.block}` : null,
                      offer.billingAddress.entrance ? `Sc. ${offer.billingAddress.entrance}` : null,
                      offer.billingAddress.apartment ? `Ap. ${offer.billingAddress.apartment}` : null,
                      offer.billingAddress.city ? offer.billingAddress.city : null,
                      offer.billingAddress.county ? offer.billingAddress.county : null,
                    ]
                      .filter(Boolean) // Elimină orice valoare null, undefined sau string gol
                      .join(", ") // Concatenează doar valorile valide
                  : "Adresa de facturare nu este disponibilă - Produse Neselectate"}
              </p>

              <h5>Adresa de Livrare:</h5>
              <p>
                {offer.pickupAtCentral
                  ? "Ridicare de la sediul central"
                  : offer.deliveryAddress
                  ? [
                    offer.deliveryAddress.street ? `Strada ${offer.deliveryAddress.street}` : null,
                    offer.deliveryAddress.number ? `Nr. ${offer.deliveryAddress.number}` : null,
                    offer.deliveryAddress.block ? `Bloc ${offer.deliveryAddress.block}` : null,
                    offer.deliveryAddress.entrance ? `Sc. ${offer.deliveryAddress.entrance}` : null,
                    offer.deliveryAddress.apartment ? `Ap. ${offer.deliveryAddress.apartment}` : null,
                    offer.deliveryAddress.city ? offer.deliveryAddress.city : null,
                    offer.deliveryAddress.county ? offer.deliveryAddress.county : null,
                  ]
                      .filter(Boolean) // Elimină valorile goale
                      .join(", ")
                  : "Adresa de livrare nu este disponibilă - Produse Neselectate"}
              </p>
            </Col>
          </Row>

          

          {user?.role === "client" && (!offer.selectedParts || offer.selectedParts.length === 0) && offer?.status != "anulata" && (
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

          {renderProductTable()}

          {user?.role === "admin" && (
            <>
              <Button
                variant="warning"
                className="me-2"
                onClick={() => setShowEditModal(true)}
              >
                <i className="ri-edit-line"></i> Editare Produse
              </Button>
              <Button
                variant="success"
                className="me-2"
                onClick={() => setShowAddModal(true)}
              >
                <i className="ri-add-circle-line"></i> Adaugă Produse
              </Button>
            </>
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
      <EditProductsModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        offer={offer}
        onUpdate={handleProductsUpdate}
      />
      <AddProductsModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        offer={offer}
        onUpdate={handleProductsUpdate}
      />
    </Container>
  );
};

export default OfferDetail;
