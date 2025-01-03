import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useSelector } from "react-redux";
import SelectProductsModal from "./SelectProductsModal"; // Asigură-te că este importat corect


const OfferDetail = () => {
  const { offerId } = useParams();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated, authChecked } = useSelector((state) => state.auth); // Folosim Redux pentru starea autentificării
  const [showSelectModal, setShowSelectModal] = useState(false); // Stare pentru a controla vizibilitatea modalului
  const [isReadOnly, setIsReadOnly] = useState(false); // Stare pentru a controla dacă modalul este în mod "readonly" sau editabil
  const [showAcceptRejectButtons, setShowAcceptRejectButtons] = useState(false); // Nouă stare


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
        console.log("Access token missing");
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
  
  
  const exportSelectedToPDF = () => {
    if (!offer || !offer.selectedParts?.length) {
      setError("Oferta nu conține produse selectate pentru export.");
      return;
    }

    const doc = new jsPDF(); // Asigură-te că este definit aici
    // Detalii companie
    const companyDetails = `FURNIZOR:\nGLOBAL QUALITY SOLUTIONS SRL\nBdul. Marasti 25 E, Bucuresti, Sector 1\nCUI: 17426176\nNr reg comertului: J40/6018/2005`;
  
    // Detalii cumpărător
    const buyerDetails =
      offer.orderId?.userType === "persoana_fizica"
        ? `Nume Client: ${offer.orderId.firstName || "N/A"} ${offer.orderId.lastName || "N/A"}\nTelefon: ${offer.orderId.phoneNumber || "N/A"}\nEmail: ${offer.orderId.email || "N/A"}`
        : `Firma: ${offer.orderId?.companyDetails?.companyName || "N/A"}\nCUI: ${offer.orderId?.companyDetails?.cui || "N/A"}\nNr. Reg. Com: ${offer.orderId?.companyDetails?.nrRegCom || "N/A"}\nTelefon: ${offer.orderId.phoneNumber || "N/A"}\nEmail: ${offer.orderId.email || "N/A"}`;
  
    // Adresa de facturare
    const billingAddress = `Adresa Facturare:\n${offer.billingAddress?.street || "N/A"} ${offer.billingAddress?.number || ""}\nBloc: ${offer.billingAddress?.block || "-"}, Scara: ${offer.billingAddress?.entrance || "-"}, Ap: ${offer.billingAddress?.apartment || "-"}\n${offer.billingAddress?.city || "N/A"}, ${offer.billingAddress?.county || "N/A"}`;
  
    // Adresa de livrare
    const deliveryAddress = offer.pickupAtCentral
      ? "Adresa Livrare: Ridicare de la sediul central"
      : `Adresa Livrare:\n${offer.deliveryAddress?.street || "N/A"} ${offer.deliveryAddress?.number || ""}\nBloc: ${offer.deliveryAddress?.block || "-"}, Scara: ${offer.deliveryAddress?.entrance || "-"}, Ap: ${offer.deliveryAddress?.apartment || "-"}\n${offer.deliveryAddress?.city || "N/A"}, ${offer.deliveryAddress?.county || "N/A"}`;
  
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
  
    // Adresa facturare (dreapta, sub detalii cumpărător)
    const billingLines = doc.splitTextToSize(billingAddress, 90);
    billingLines.forEach((line, index) => {
      doc.text(line, rightStartX, startY + clientLines.length * 5 + index * 5);
    });
  
    // Adresa livrare (dreapta, sub adresa facturare)
    const deliveryLines = doc.splitTextToSize(deliveryAddress, 90);
    deliveryLines.forEach((line, index) => {
      doc.text(line, rightStartX, startY + (clientLines.length + billingLines.length) * 5 + index * 5);
    });
    

    // Titlu oferta
    doc.setFontSize(14);
    const pageWidth = doc.internal.pageSize.width;
    const titleText = `Oferta #${offer.offerNumber}`;
    const statusText = `Status: ${offer.status}`;
    const titleX = (pageWidth - doc.getTextWidth(titleText)) / 2;
    const statusX = (pageWidth - doc.getTextWidth(statusText)) / 2;
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
        part.partCode || "N/A",
        part.partType || "N/A",
        part.manufacturer || "N/A",
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
  
    // Total selectii (dreapta)
    const totalText = `Total selectii: ${totalSelectedParts.toFixed(2)} RON`;
    const totalTextWidth = doc.getTextWidth(totalText);
    const totalX = pageWidth - totalTextWidth - 10;
  
    doc.text(totalText, totalX, doc.previousAutoTable.finalY + 10);
  
    // Salvare PDF
    doc.save(`Oferta_${offer.offerNumber}.pdf`);
  };

  if (loading) return <div className="alert alert-info">Se încarcă oferta...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

   // Gestionarea modalului
   const handleViewSelections = () => {
    setShowSelectModal(true);
    setIsReadOnly(true);
  };

  const handleSelectProducts = () => {
    setShowSelectModal(true);
    setIsReadOnly(false); // Setăm modalul în modul de editare
  };

  const handleCloseModal = async (updatedOffer, showButtons = false) => {
    setShowSelectModal(false);
  
    // Actualizează oferta dacă există o ofertă nouă sau reîmprospătează datele
    if (updatedOffer) {
      setOffer(updatedOffer);
    } else {
      await fetchOffer(); // Reîmprospătează datele dacă nu este transmisă o ofertă actualizată
    }
  
    setShowAcceptRejectButtons(showButtons); // Controlează afișarea butoanelor Accept/Reject
  };
  

  const saveSelections = async ({
    selectedParts,
    billingAddress,
    deliveryAddress,
    pickupAtCentral,
  }) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:5000/api/offer/${offerId}/selected-parts`,
        {
          method: "PATCH",
          body: JSON.stringify({
            selectedParts,
            billingAddress,
            deliveryAddress,
            pickupAtCentral,
          }),
        }
      );
  
      if (!response.success) throw new Error("Eroare la salvarea selecțiilor.");
  
      // Fetch the updated offer data
      await fetchOffer();
  
      // Arată butoanele de Accept/Reject
      setShowAcceptRejectButtons(true);
      setShowSelectModal(false);
    } catch (err) {
      setError(err.message || "Eroare de rețea.");
    }
  };
  

  const handleAcceptOffer = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:5000/api/offer/${offerId}/accept`,
        { method: "PATCH" }
      );
  
      if (!response.success) throw new Error("Eroare la acceptarea ofertei.");
  
      // Reîmprospătează oferta pentru a reflecta statusul actualizat
      await fetchOffer();
      setShowAcceptRejectButtons(false); // Ascunde butoanele după acceptare
    } catch (err) {
      setError(err.message || "Eroare de rețea.");
    }
  };
  

  const handleRejectOffer = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:5000/api/offer/${offerId}/reject`,
        { method: "PATCH" }
      );
  
      if (!response.success) throw new Error("Eroare la respingerea ofertei.");
  
      // Reîmprospătează oferta pentru a reflecta statusul actualizat
      await fetchOffer();
      setShowAcceptRejectButtons(false); // Ascunde butoanele după respingere
    } catch (err) {
      setError(err.message || "Eroare de rețea.");
    }
  };
  
  
  const calculateTotal = () => {
    if (offer?.selectedParts?.length > 0) {
      return offer.selectedParts.reduce((sum, part) => sum + part.total, 0);
    }
    return null;
  };

  const renderProductTable = () => (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cod Piesă</th>
            <th>Tip</th>
            <th>Producător</th>
            <th>Preț/unitate</th>
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
                style={{
                  backgroundColor: isSelected ? "#d4edda" : "transparent",
                  fontWeight: isSelected ? "bold" : "normal",
                }}
              >
                <td>{index + 1}</td>
                <td>{part.partCode}</td>
                <td>{part.partType}</td>
                <td>{part.manufacturer}</td>
                <td>{part.pricePerUnit} RON</td>
                <td>{part.quantity}</td>
                <td>{isSelected ? `${selectedPart.total} RON` : `${part.pricePerUnit * part.quantity} RON`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (loading) return <div className="alert alert-info">Se încarcă oferta...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const total = calculateTotal();


  return (
    <div className="container my-4">
      <h2 className="text-center">Detalii ofertă #{offer?.offerNumber}</h2>  {/* Folosim `offer?.offerNumber` pentru a preveni eroarea */}
      {/* Status și Total */}
      <h5>Status: {offer.status}</h5>
      {total !== null ? (
        <h4>Total ofertă: {total.toFixed(2)} RON</h4>
      ) : (
        <h4 className="text-danger">Total ofertă: Selectează produsele</h4>
      )}

	  {/* Detalii Client */}
      <div className="mb-4">
        <h5>Detalii Client:</h5>
        <p>
          {offer.orderId?.userType === "persoana_fizica"
            ? `Nume: ${offer.orderId.firstName} ${offer.orderId.lastName}, Telefon: ${offer.orderId.phoneNumber}, Email: ${offer.orderId.email}`
            : `Firma: ${offer.orderId.companyDetails.companyName}, CUI: ${offer.orderId.companyDetails.cui}, Nr. Reg. Com: ${offer.orderId.companyDetails.nrRegCom}, Telefon: ${offer.orderId.phoneNumber}, Email: ${offer.orderId.email}`}
        </p>

        <h5>Adresa Facturare:</h5>
        <p>
          {offer.billingAddress ? (
            `${offer.billingAddress.street} ${offer.billingAddress.number}, ${offer.billingAddress.city}, ${offer.billingAddress.county}`
          ) : "Adresa nu este disponibilă"}
        </p>

        <h5>Adresa Livrare:</h5>
        <p>
          {offer.pickupAtCentral
            ? "Ridicare de la sediul central"
            : offer.deliveryAddress ? (
                `${offer.deliveryAddress.street} ${offer.deliveryAddress.number}, ${offer.deliveryAddress.city}, ${offer.deliveryAddress.county}`
              ) : "Adresa livrare nu este disponibilă"}
        </p>
      </div>

      {/* Tabel cu piese */}
      <div className="mb-4">
        <h5>Piese incluse în ofertă:</h5>
        {renderProductTable()}
        {(!offer.selectedParts || offer.selectedParts.length === 0) && (
          <button
            className="btn btn-primary mt-3"
            onClick={handleSelectProducts}
          >
            Selectează produse
          </button>
        )}

          {offer.status === "comanda_spre_finalizare" && (
          <>
            <button
              className="btn btn-success"
              onClick={handleAcceptOffer}
            >
              Acceptă oferta
            </button>
            <button
              className="btn btn-danger"
              onClick={handleRejectOffer}
            >
              Respinge oferta
            </button>
          </>
        )}
      </div>


      {/* Export PDF */}
      <button
        className="btn btn-outline-primary"
        onClick={exportSelectedToPDF}
        disabled={!offer.selectedParts?.length}
      >
        Exportă selecțiile ca PDF
      </button>

      {/* Modal pentru selectarea pieselor */}
      <SelectProductsModal
        show={showSelectModal}
        onHide={() => handleCloseModal(null, false)}
        offer={offer}
        readonlyMode={isReadOnly}
        onSaveSelection={saveSelections}
      />
    </div>
  );
};

export default OfferDetail;

