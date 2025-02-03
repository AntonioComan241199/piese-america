import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "../styles/AdminOffers.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";


const AdminOffers = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");  // Filtru status ofertă
  const [offerNumber, setOfferNumber] = useState("");   // Filtru număr ofertă
  const [selectedDate, setSelectedDate] = useState("");   // Filtru dată selectată
  const [partCode, setPartCode] = useState(""); // Filtru pentru codul de produs
  const [currentPage, setCurrentPage] = useState(1);    // Paginare
  const [totalPages, setTotalPages] = useState(1);

  // Funcția de obținere a ofertelor
  const fetchOffers = async (selectedDate) => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Trebuie să fiți autentificat pentru a accesa ofertele.");
      setLoading(false);
      return;
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const url = new URL(`${API_URL}/offer/admin`);
      url.searchParams.append("page", currentPage);
      url.searchParams.append("status", statusFilter);
      url.searchParams.append("offerNumber", offerNumber);
      if (selectedDate) {
        url.searchParams.append("selectedDate", selectedDate); // Folosim selectedDate
      }
      if (partCode) {
        url.searchParams.append("partCode", partCode); // Adaugă codul de produs la cerere
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

  // Funcția de filtrare
  const handleFilter = () => {
    setCurrentPage(1); // Resetăm pagina la prima
    // Convertește selectedDate într-un format corespunzător (fără ora)
    const formattedDate = selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : ''; 
    fetchOffers(formattedDate); // Apelăm funcția pentru a aplica filtrele
  };

  // Resetarea filtrelor
  const handleResetFilters = () => {
    setStatusFilter("");
    setOfferNumber("");
    setSelectedDate("");  // Resetăm și selectedDate
    setCurrentPage(1); // Resetăm pagina
    fetchOffers(""); // Reîncarcă ofertele după resetarea filtrelor
  };

  const updateOfferStatus = async (offerId, status) => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${API_URL}/offer/admin/${offerId}/delivery`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ deliveryStatus: status }),
        }
      );

      if (!response.ok) {
        throw new Error("Eroare la actualizarea statusului ofertei.");
      }

      await fetchOffers(""); // Reîncarcă ofertele după actualizare
    } catch (error) {
      setError(error.message);
    }
  };

  const exportCSV = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const url = new URL(`${API_URL}/offer/admin/export`);
      url.searchParams.append("status", statusFilter);
      url.searchParams.append("offerNumber", offerNumber);
      if (selectedDate) {
        url.searchParams.append("selectedDate", selectedDate); // Folosim selectedDate pentru export
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Eroare la exportul ofertelor.");
      }

      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = "offers" + new Date().toISOString() + ".csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOffers(""); // Asigură-te că se încarcă ofertele la început
    } else {
      setError("Trebuie să fiți autentificat pentru a accesa ofertele.");
      setLoading(false);
    }
  }, [isAuthenticated, currentPage, statusFilter, offerNumber, selectedDate]);  // Eliminăm phoneNumber din dependințe

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handlePageChange = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" });
  };

  if (loading) return <div className="text-center">Se încarcă...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Gestionare Oferte</h2>

      {/* Filters */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div className="d-flex flex-wrap">
          <select
            className="form-select w-auto me-2"
            value={statusFilter}
            onChange={handleStatusChange}
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
            className="form-control w-auto me-2"
            placeholder="Număr ofertă"
            value={offerNumber}
            onChange={(e) => setOfferNumber(e.target.value)}
          />
          <input
            type="date"
            className="form-control w-auto me-2"
            placeholder="Selectează dată"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <input
            type="text"
            className="form-control w-auto me-2"
            placeholder="Cod produs"
            value={partCode}
            onChange={(e) => setPartCode(e.target.value)}
          />
          <button className="btn btn-outline-secondary" onClick={handleFilter}>
            Filtrează
          </button>
          <button className="btn btn-outline-danger ms-2" onClick={handleResetFilters}>
            Resetare Filtre
          </button>
        </div>
        <div>
          <button className="btn btn-outline-primary" onClick={exportCSV}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Offers Table */}
      {offers.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Număr Cerere</th>
                <th>Total</th>
                <th>Status</th>
                <th>Creată La</th>
                <th>Ultima Modificare</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer, index) => (
                <tr key={offer._id}>
                  <td>{(currentPage - 1) * 10 + index + 1}</td>
                  <td>
                    <Link to={`/orders/${offer.orderId._id}`}>
                      #{offer.orderId.orderNumber}
                    </Link>
                  </td>
                  <td>
                  {offer.selectedParts && offer.selectedParts.length > 0
                    ? `${offer.total} RON`
                    : "Produse Neselectate"}
                  </td>
                  <td>{offer.status}</td>
                  <td>{formatDateTime(offer.createdAt)}</td>
                  <td>{formatDateTime(offer.updatedAt)}</td>
                  <td>
                  <div className="dropdown">
                <button
                  className="btn btn-primary btn-sm dropdown-toggle position-static"
                  type="button"
                  id={`dropdown-${offer._id}`}
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Acțiuni
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end" /* Poziționează meniul în afara containerului */
                  aria-labelledby={`dropdown-${offer._id}`}
                >
                  <li>
                    <Link to={`/offer/${offer._id}`} className="dropdown-item">
                      Detalii
                    </Link>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => updateOfferStatus(offer._id, "livrare_in_procesare")}
                      disabled={offer.status !== "oferta_acceptata"}
                    >
                      Livrare în Procesare
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => updateOfferStatus(offer._id, "livrata")}
                      disabled={offer.status !== "livrare_in_procesare"}
                    >
                      Livrată
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={() => updateOfferStatus(offer._id, "anulata")}
                      disabled={offer.status === "anulata"}
                    >
                      Anulată
                    </button>
                  </li>
                </ul>
              </div>
              </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="alert alert-info text-center">
          Nu există oferte disponibile.
        </div>
      )}

      {/* Pagination */}
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

export default AdminOffers;
