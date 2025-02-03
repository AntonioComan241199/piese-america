import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import SelectProductsModal from "./SelectProductsModal";
import "../styles/MyOffers.css";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";


const MyOffers = () => {
  const { isAuthenticated, authChecked } = useSelector((state) => state.auth);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState({});
  const [isReadOnly, setIsReadOnly] = useState(false); // Stare pentru modul de vizualizare

  // Stările pentru filtre
  const [statusFilter, setStatusFilter] = useState(""); // Filtru status
  const [offerNumber, setOfferNumber] = useState(""); // Filtru număr ofertă
  const [selectedDate, setSelectedDate] = useState(""); // Filtru dată
  const [currentPage, setCurrentPage] = useState(1); // Paginare
  const [totalPages, setTotalPages] = useState(1); // Total pagini

  // Funcția de obținere a ofertelor cu filtre și paginare
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

      const url = new URL(`${API_URL}/offer/client`);
      url.searchParams.append("page", currentPage);
      url.searchParams.append("status", statusFilter);
      url.searchParams.append("offerNumber", offerNumber);
      if (selectedDate) {
        const formattedDate = new Date(selectedDate).toISOString().split("T")[0];
        url.searchParams.append("selectedDate", formattedDate);
      }

      const response = await fetch(url.toString(), { method: "GET", headers });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Eroare la obținerea ofertelor.");
      }

      const data = await response.json();
      setOffers(data.data || []);
      setTotalPages(data.pagination.pages || 1);
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
  }, [isAuthenticated, authChecked, currentPage, statusFilter, offerNumber, selectedDate]);

  const handleViewSelections = (offer) => {
    const updatedOffer = offers.find((o) => o._id === offer._id) || offer;
    setSelectedOffer(updatedOffer);
    setShowSelectModal(true);
    setIsReadOnly(true);
  };
  
  

  const handleSelectProducts = (offer) => {
    setSelectedOffer(offer);
    setShowSelectModal(true);
    setIsReadOnly(false); // Setăm modalul în modul de editare
  };

  const handleCloseModal = () => {
    setSelectedOffer({});
    setIsReadOnly(false);
    setShowSelectModal(false);
    window.location.reload(); // Reîncarcă pagina complet
  };

  const saveSelections = async ({
    selectedParts,
    billingAddress,
    deliveryAddress,
    pickupAtCentral,
  }) => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setError("Trebuie să fiți autentificat pentru a efectua această acțiune.");
        return;
      }

      const response = await fetch(
        `${API_URL}/offer/${selectedOffer._id}/selected-parts`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            selectedParts,
            billingAddress,
            deliveryAddress,
            pickupAtCentral,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Eroare la salvarea selecțiilor.");
      }

      fetchOffers();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      const token = localStorage.getItem("accessToken");
  
      const response = await fetch(
        `${API_URL}/offer/${offerId}/accept`,
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
  
      await fetchOffers();
      setSelectedOffer({});
      setShowSelectModal(false);
    } catch (error) {
      setError(error.message);
    }
  };
  
  const handleRejectOffer = async (offerId) => {
    try {
      const token = localStorage.getItem("accessToken");
  
      const response = await fetch(
        `${API_URL}/${offerId}/reject`,
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
  
      await fetchOffers();
      setSelectedOffer({});
      setShowSelectModal(false);
    } catch (error) {
      setError(error.message);
    }
  };
  
  
  
  


  const handlePageChange = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Funcție pentru resetarea filtrelor
  const handleResetFilters = () => {
    setStatusFilter("");
    setOfferNumber("");
    setSelectedDate("");
    setCurrentPage(1);
    fetchOffers(); // Reîncarcă ofertele după resetarea filtrelor
  };

  if (loading) return <div className="text-center">Se încarcă...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Ofertele mele</h2>

      {/* Filtrele */}
      <div className="d-flex flex-column flex-md-row mb-3">
        <select
          className="form-select w-auto me-md-2 mb-2 mb-md-0"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Toate Statusurile</option>
          <option value="proiect">Proiect</option>
          <option value="oferta_acceptata">Ofertă Acceptată</option>
          <option value="livrare_in_procesare">Livrare în Procesare</option>
          <option value="livrata">Livrată</option>
          <option value="anulata">Anulată</option>
        </select>
        <input
          type="number"
          className="form-control w-auto me-md-2 mb-2 mb-md-0"
          placeholder="Număr ofertă"
          value={offerNumber}
          onChange={(e) => setOfferNumber(e.target.value)}
        />
        <input
          type="date"
          className="form-control w-auto me-md-2 mb-2 mb-md-0"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <div className="d-flex flex-column flex-md-row">
          <button className="btn btn-outline-secondary mb-2 mb-md-0" onClick={fetchOffers}>
            Filtrează
          </button>
          <button className="btn btn-outline-danger ms-2" onClick={handleResetFilters}>
            Resetare Filtre
          </button>
        </div>
      </div>

      <SelectProductsModal
        show={showSelectModal}
        offer={selectedOffer}
        readonlyMode={isReadOnly}
        onSaveSelection={(data) => saveSelections(data)}
        onAcceptOffer={handleAcceptOffer}
        onRejectOffer={handleRejectOffer}
        onHide={handleCloseModal}
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
              <th>Dată Creare</th>
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
                <td>
                  {offer.selectedParts && offer.selectedParts.length > 0
                    ? `${offer.total} RON`
                    : "Produse Neselectate"}
                </td>
                <td>{offer.status}</td>
                <td>{new Date(offer.createdAt).toLocaleString("ro-RO")}</td>
                <td>
                  <div className="d-flex flex-wrap gap-2">
                    {offer.status === "proiect" && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSelectProducts(offer)}
                      >
                        {offer.selectedParts?.length > 0
                          ? "Editează selecțiile"
                          : "Selectează produse"}
                      </button>
                    )}
                    {offer.status !== "proiect" && (
                      <Link
                        to={`/offer/${offer._id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Detalii
                      </Link>
                    )}
                    {offer.status === "comanda_spre_finalizare" && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewSelections(offer)}
                      >
                        Vizualizează selecțiile
                      </button>
                    )}
                  </div>
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

      {/* Paginare */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <button
          className="btn btn-outline-secondary"
          onClick={() => handlePageChange("prev")}
          disabled={currentPage === 1}
        >
          Înapoi
        </button>
        <span>
          Pagina {currentPage} din {totalPages}
        </span>
        <button
          className="btn btn-outline-secondary"
          onClick={() => handlePageChange("next")}
          disabled={currentPage === totalPages}
        >
          Înainte
        </button>
      </div>
    </div>
  );
};

export default MyOffers;
