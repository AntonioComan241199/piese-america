import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import SelectProductsModal from "./SelectProductsModal";

const MyOffers = () => {
  const { isAuthenticated, authChecked } = useSelector((state) => state.auth);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState({});

  const fetchOffers = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Trebuie să fiți autentificat pentru a vizualiza ofertele.");
      setLoading(false);
      return;
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch("http://localhost:5000/api/offer/client", {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Eroare la obținerea ofertelor.");
      }

      const data = await response.json();
      setOffers(data.data || []);
      setError("");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked) {
      if (isAuthenticated) {
        fetchOffers();
      } else {
        setError("Trebuie să fiți autentificat pentru a vizualiza ofertele.");
        setLoading(false);
      }
    }
  }, [isAuthenticated, authChecked]);

  const handleSelectProducts = (offer) => {
    setSelectedOffer(offer);
    setShowSelectModal(true);
  };

  const handleDownloadPDF = (offer) => {
    const doc = new jsPDF();
    const tableColumn = [
      "Cod Piesa",
      "Tip",
      "Producator",
      "Pret/unitate",
      "Cantitate",
      "Total",
    ];
    const tableRows = [];

    offer.selectedParts.forEach((part) => {
      const rowData = [
        part.partCode,
        part.partType,
        part.manufacturer,
        `${part.pricePerUnit} RON`,
        part.quantity,
        `${part.total} RON`,
      ];
      tableRows.push(rowData);
    });

    doc.text(`Detalii oferta #${offer.offerNumber}`, 14, 10);
    doc.text(`Status: ${offer.status}`, 14, 20);
    doc.text(`Total oferta: ${offer.total} RON`, 14, 30);
    doc.autoTable({
      startY: 40,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save(`Oferta_${offer.offerNumber}.pdf`);
  };

  const saveSelections = async (selections) => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setError("Trebuie să fiți autentificat pentru a efectua această acțiune.");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/offer/${selectedOffer._id}/selected-parts`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ selectedParts: selections }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Eroare la salvarea selecțiilor.");
      }

      fetchOffers();
      setShowSelectModal(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `http://localhost:5000/api/offer/${offerId}/accept`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Eroare la acceptarea ofertei.");
      }

      fetchOffers();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `http://localhost:5000/api/offer/${offerId}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Eroare la respingerea ofertei.");
      }

      fetchOffers();
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div className="text-center">Se încarcă...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Ofertele mele</h2>

      <SelectProductsModal
        show={showSelectModal}
        onHide={() => setShowSelectModal(false)}
        offer={
          selectedOffer.status === "comanda_spre_finalizare"
            ? { ...selectedOffer, parts: selectedOffer.selectedParts }
            : selectedOffer
        }
        onSaveSelection={saveSelections}
      />

      {offers.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Cerere</th>
                <th>Total</th>
                <th>Status</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer, index) => (
                <tr key={offer._id}>
                  <td>{index + 1}</td>
                  <td>
                    {offer.orderId ? (
                      <Link to={`/orders/${offer.orderId._id}`}>
                        #{offer.orderId.orderNumber}
                      </Link>
                    ) : (
                      "Cerere indisponibilă"
                    )}
                  </td>
                  <td>{offer.total ? `${offer.total} RON` : "N/A"}</td>
                  <td>{offer.status}</td>
                  <td>
                    {offer.status === "proiect" && (
                      <button
                        className="btn btn-primary btn-sm me-2"
                        onClick={() => handleSelectProducts(offer)}
                      >
                        Selectează produse
                      </button>
                    )}
                    {offer.status === "comanda_spre_finalizare" && (
                      <>
                        <button
                          className="btn btn-secondary btn-sm me-2"
                          onClick={() => handleSelectProducts(offer)}
                        >
                          Vizualizează selecțiile
                        </button>
                        <button
                          className="btn btn-success btn-sm me-2"
                          onClick={() => handleAcceptOffer(offer._id)}
                        >
                          Acceptă
                        </button>
                        <button
                          className="btn btn-danger btn-sm me-2"
                          onClick={() => handleRejectOffer(offer._id)}
                        >
                          Respinge
                        </button>
                      </>
                    )}
                    {(offer.status === "comanda_spre_finalizare" ||
                      offer.status === "oferta_acceptata" ||
                      offer.status === "oferta_respinsa") && (
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => handleDownloadPDF(offer)}
                      >
                        Descarcă PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="alert alert-info text-center">
          Nu aveți oferte disponibile.
        </div>
      )}
    </div>
  );
};

export default MyOffers;
