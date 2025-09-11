import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "../../styles/AdminOffers.css";

const API_URL = import.meta.env.VITE_API_URL;


const AdminOffers = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  
  // Filters state
  const [filters, setFilters] = useState({
    status: "",
    offerNumber: "",
    selectedDate: "",
    partCode: ""
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Optimized fetch function with useCallback
  const fetchOffers = useCallback(async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Trebuie să fiți autentificat pentru a accesa ofertele.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const url = new URL(`${API_URL}/offer/admin`);
      url.searchParams.append("page", currentPage);
      url.searchParams.append("status", filters.status);
      url.searchParams.append("offerNumber", filters.offerNumber);
      
      if (filters.selectedDate) {
        const formattedDate = new Date(filters.selectedDate).toISOString().split('T')[0];
        url.searchParams.append("selectedDate", formattedDate);
      }
      if (filters.partCode) {
        url.searchParams.append("partCode", filters.partCode);
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
  }, [currentPage, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Apply filters (resets to first page)
  const handleApplyFilters = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setFilters({
      status: "",
      offerNumber: "",
      selectedDate: "",
      partCode: ""
    });
    setCurrentPage(1);
  }, []);

  // Optimized status update with individual loading states
  const updateOfferStatus = useCallback(async (offerId, status) => {
    if (!window.confirm(`Confirmați schimbarea statusului la "${status}"?`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [offerId]: true }));
    
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

      // Update the offer in state instead of refetching all
      setOffers(prevOffers => 
        prevOffers.map(offer => 
          offer._id === offerId 
            ? { ...offer, status, updatedAt: new Date().toISOString() }
            : offer
        )
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [offerId]: false }));
    }
  }, []);

  const exportCSV = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const url = new URL(`${API_URL}/offer/admin/export`);
      url.searchParams.append("status", filters.status);
      url.searchParams.append("offerNumber", filters.offerNumber);
      if (filters.selectedDate) {
        const formattedDate = new Date(filters.selectedDate).toISOString().split('T')[0];
        url.searchParams.append("selectedDate", formattedDate);
      }
      if (filters.partCode) {
        url.searchParams.append("partCode", filters.partCode);
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
      link.download = `offers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
    } catch (error) {
      setError(error.message);
    }
  }, [filters]);

  // Simplified useEffect - only fetch when dependencies change
  useEffect(() => {
    if (isAuthenticated) {
      fetchOffers();
    } else {
      setError("Trebuie să fiți autentificat pentru a accesa ofertele.");
      setLoading(false);
    }
  }, [isAuthenticated, fetchOffers]);

  // Memoized date formatter
  const formatDateTime = useMemo(() => (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" });
  }, []);

  const handlePageChange = useCallback((direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  // Handle dropdown toggle
  const toggleDropdown = useCallback((offerId) => {
    setOpenDropdown(prev => prev === offerId ? null : offerId);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
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
            value={filters.offerNumber}
            onChange={(e) => handleFilterChange('offerNumber', e.target.value)}
          />
          <input
            type="date"
            className="form-control w-auto me-2"
            placeholder="Selectează dată"
            value={filters.selectedDate}
            onChange={(e) => handleFilterChange('selectedDate', e.target.value)}
          />
          <input
            type="text"
            className="form-control w-auto me-2"
            placeholder="Cod produs"
            value={filters.partCode}
            onChange={(e) => handleFilterChange('partCode', e.target.value)}
          />
          <button className="btn btn-outline-secondary" onClick={handleApplyFilters}>
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
                <th>Valoare fara TVA</th>
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
                  <div className="dropdown position-relative">
                <button
                  className="btn btn-primary btn-sm dropdown-toggle"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown(offer._id);
                  }}
                  disabled={actionLoading[offer._id]}
                >
                  {actionLoading[offer._id] ? "Se procesează..." : "Acțiuni"}
                </button>
                {openDropdown === offer._id && (
                  <ul className="dropdown-menu dropdown-menu-end show position-absolute" style={{ zIndex: 1000 }}>
                    <li>
                      <Link to={`/offer/${offer._id}`} className="dropdown-item">
                        Detalii
                      </Link>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOfferStatus(offer._id, "livrare_in_procesare");
                          setOpenDropdown(null);
                        }}
                        disabled={offer.status !== "oferta_acceptata" || actionLoading[offer._id]}
                      >
                        {actionLoading[offer._id] && offer.status === "oferta_acceptata" ? "..." : "Livrare în Procesare"}
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOfferStatus(offer._id, "livrata");
                          setOpenDropdown(null);
                        }}
                        disabled={offer.status !== "livrare_in_procesare" || actionLoading[offer._id]}
                      >
                        {actionLoading[offer._id] && offer.status === "livrare_in_procesare" ? "..." : "Livrată"}
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOfferStatus(offer._id, "anulata");
                          setOpenDropdown(null);
                        }}
                        disabled={offer.status === "anulata" || actionLoading[offer._id]}
                      >
                        {actionLoading[offer._id] ? "..." : "Anulată"}
                      </button>
                    </li>
                  </ul>
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
