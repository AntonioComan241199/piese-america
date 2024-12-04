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
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchOffer = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setError("Trebuie să fiți autentificat pentru a accesa ofertele.");
        setLoading(false);
        return;
      }

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
    const doc = new jsPDF();
    const tableColumn = ["Cod Piesa", "Tip", "Producator", "Pret/unitate", "Cantitate", "Total"];
    const tableRows = [];
  
    let totalSelectedParts = 0;
  
    offer.selectedParts.forEach((part) => {
      const rowData = [
        part.partCode,
        part.partType,
        part.manufacturer,
        `${part.pricePerUnit} RON`,
        part.quantity,
        `${part.total} RON`,
      ];
      totalSelectedParts += part.total; // Calculăm totalul pentru produsele selectate
      tableRows.push(rowData);
    });
  
    doc.text(`Detalii oferta #${offer.offerNumber}`, 14, 10);
    doc.text(`Status: ${offer.status}`, 14, 20);
    doc.autoTable({
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });
  
    // Adăugăm totalul la final
    doc.text(`Total selectii: ${totalSelectedParts} RON`, 14, doc.previousAutoTable.finalY + 10);
  
    doc.save(`Oferta_${offer.offerNumber}.pdf`);
  };
  

  if (loading) return <div className="alert alert-info">Se încarcă oferta...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container my-4">
      <h2 className="text-center">Detalii ofertă #{offer.offerNumber}</h2>
      {message && <div className="alert alert-success">{message}</div>}
      <h4>Total ofertă: {offer.total} RON</h4>
      <h5>Status: {offer.status}</h5>

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
