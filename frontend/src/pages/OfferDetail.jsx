import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const OfferDetail = () => {
  const { offerId } = useParams();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const response = await fetchWithAuth(`http://localhost:5000/api/offer/${offerId}`);
        setOffer(response.offer);
      } catch (err) {
        setError("Nu s-a putut încărca oferta.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [offerId]);

  const exportSelectedToPDF = () => {
    if (!offer) {
      setError("Oferta nu este încărcată complet. Reîncercați.");
      return;
    }
  
    const doc = new jsPDF();
  
    // Detalii companie
    const companyDetails = `
    FURNIZOR:
  GLOBAL QUALITY SOLUTIONS SRL
  Bdul. Marasti 25 E, Bucuresti, Sector 1
  CUI: 17426176
  Nr reg comertului: J40/6018/2005`;
  
    // Detalii cumpărător
    const buyerDetails =
      offer.orderId?.userType === "persoana_fizica"
        ? `Nume Client: ${offer.orderId.firstName || "N/A"} ${offer.orderId.lastName || "N/A"}
  Telefon: ${offer.orderId.phoneNumber || "N/A"}
  Email: ${offer.orderId.email || "N/A"}`
        : `Firma: ${offer.orderId?.companyDetails?.companyName || "N/A"}
  CUI: ${offer.orderId?.companyDetails?.cui || "N/A"}
  Nr. Reg. Com: ${offer.orderId?.companyDetails?.nrRegCom || "N/A"}
  Telefon: ${offer.orderId.phoneNumber || "N/A"}
  Email: ${offer.orderId.email || "N/A"}`;
  
    // Adresa de facturare
    const billingAddress = `
  Adresa Facturare:
  ${offer.billingAddress?.street || "N/A"} ${offer.billingAddress?.number || ""}
  Bloc: ${offer.billingAddress?.block || "-"}, Scara: ${offer.billingAddress?.entrance || "-"}, Ap: ${offer.billingAddress?.apartment || "-"}
  ${offer.billingAddress?.city || "N/A"}, ${offer.billingAddress?.county || "N/A"}`;
  
    // Adresa de livrare
    const deliveryAddress = offer.pickupAtCentral
      ? "Adresa Livrare: Ridicare de la sediul central"
      : `
  Adresa Livrare:
  ${offer.deliveryAddress?.street || "N/A"} ${offer.deliveryAddress?.number || ""}
  Bloc: ${offer.deliveryAddress?.block || "-"}, Scara: ${offer.deliveryAddress?.entrance || "-"}, Ap: ${offer.deliveryAddress?.apartment || "-"}
  ${offer.deliveryAddress?.city || "N/A"}, ${offer.deliveryAddress?.county || "N/A"}`;
  
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

  return (
    <div className="container my-4">
      <h2 className="text-center">Detalii ofertă #{offer.offerNumber}</h2>
      <h4>Total ofertă: {offer.total} RON</h4>
      <h5>Status: {offer.status}</h5>

      <div className="mb-4">
        <h5>Detalii Client:</h5>
        <p>
          {offer.orderId?.userType === "persoana_fizica"
            ? `Nume: ${offer.orderId.firstName} ${offer.orderId.lastName}, Telefon: ${offer.orderId.phoneNumber}, Email: ${offer.orderId.email}`
            : `Firma: ${offer.orderId.companyDetails.companyName}, CUI: ${offer.orderId.companyDetails.cui}, Nr. Reg. Com: ${offer.orderId.companyDetails.nrRegCom}, Telefon: ${offer.orderId.phoneNumber}, Email: ${offer.orderId.email}`}
        </p>

        <h5>Adresa Facturare:</h5>
        <p>
          {offer.billingAddress.street} {offer.billingAddress.number}, {offer.billingAddress.city},{" "}
          {offer.billingAddress.county}
        </p>

        <h5>Adresa Livrare:</h5>
        <p>
          {offer.pickupAtCentral
            ? "Ridicare de la sediul central"
            : `${offer.deliveryAddress.street} ${offer.deliveryAddress.number}, ${offer.deliveryAddress.city}, ${offer.deliveryAddress.county}`}
        </p>
      </div>

      {/* Tabel cu piese */}
      <div className="mb-4">
        <h5>Piese incluse în ofertă:</h5>
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
                <th>Total</th>
                <th>Opțiuni</th>
              </tr>
            </thead>
            <tbody>
              {offer.parts.map((part, index) => {
                const selectedPart = offer.selectedParts.find(
                  (sp) => sp.partCode === part.partCode
                );
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
                    <td>{part.total} RON</td>
                    <td>
                      {part.options.map((option) => (
                        <div key={option._id}>
                          {option.manufacturer} - {option.price} RON
                        </div>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acțiuni suplimentare */}
      <button
        className="btn btn-outline-primary"
        onClick={exportSelectedToPDF}
      >
        Exportă selecțiile ca PDF
      </button>
    </div>
  );
};

export default OfferDetail;
