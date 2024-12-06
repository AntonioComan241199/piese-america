import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const AdminOffers = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [offerNumber, setOfferNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOffers = async () => {
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

      const url = new URL("http://localhost:5000/api/offer/admin");
      url.searchParams.append("page", currentPage);
      url.searchParams.append("status", statusFilter);
      url.searchParams.append("offerNumber", offerNumber);
      url.searchParams.append("startDate", startDate);
      url.searchParams.append("endDate", endDate);

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

  const updateOfferStatus = async (offerId, status) => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `http://localhost:5000/api/offer/admin/${offerId}/delivery`,
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

      await fetchOffers(); // Reîncarcă ofertele după actualizare
    } catch (error) {
      setError(error.message);
    }
  };

  const exportCSV = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const url = new URL("http://localhost:5000/api/offer/admin/export");
      url.searchParams.append("status", statusFilter);
      url.searchParams.append("offerNumber", offerNumber);
      url.searchParams.append("startDate", startDate);
      url.searchParams.append("endDate", endDate);

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
      fetchOffers();
    } else {
      setError("Trebuie să fiți autentificat pentru a accesa ofertele.");
      setLoading(false);
    }
  }, [isAuthenticated, currentPage, statusFilter, offerNumber, startDate, endDate]);

  const handleResetFilters = () => {
    setStatusFilter("");
    setOfferNumber("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
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
            <option value="comanda_spre_finalizare">Comandă spre Finalizare</option>
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
            placeholder="Data start filtrare"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="form-control w-auto me-2"
            placeholder="Data sfârșit filtrare"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button className="btn btn-outline-secondary" onClick={handleResetFilters}>
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
        <>
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
                    <td>{offer.total ? `${offer.total} RON` : "N/A"}</td>
                    <td>{offer.status}</td>
                    <td>{formatDateTime(offer.createdAt)}</td>
                    <td>{formatDateTime(offer.updatedAt)}</td>
                    <td>
                      <Link
                        to={`/offer/${offer._id}`}
                        className="btn btn-primary btn-sm me-2"
                      >
                        Detalii
                      </Link>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => updateOfferStatus(offer._id, "livrare_in_procesare")}
                      >
                        Procesare Livrare
                      </button>
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() => updateOfferStatus(offer._id, "livrata")}
                      >
                        Marcare Livrată
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => updateOfferStatus(offer._id, "anulata")}
                      >
                        Anulare
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
        </>
      ) : (
        <div className="alert alert-info text-center">
          Nu există oferte disponibile.
        </div>
      )}
    </div>
  );
};

export default AdminOffers;
