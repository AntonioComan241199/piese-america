import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const AdminOffers = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch offers from the server
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

      const response = await fetch(
        `http://localhost:5000/api/offer/admin/?page=${currentPage}&status=${statusFilter}`,
        { method: "GET", headers }
      );

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

  // Effect for fetching offers
  useEffect(() => {
    if (isAuthenticated) {
      fetchOffers();
    } else {
      setError("Trebuie să fiți autentificat pentru a accesa ofertele.");
      setLoading(false);
    }
  }, [isAuthenticated, currentPage, statusFilter]);

  // Handle status filter change
  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1); // Reset to first page
  };

  // Handle pagination
  const handlePageChange = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Handle export actions
  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `http://localhost:5000/api/offer/admin/export?format=${format}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Eroare la exportul ofertelor.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `offers.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div className="text-center">Se încarcă...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Gestionare Oferte</h2>

      {/* Filters and Export Actions */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <select
          className="form-select w-auto"
          value={statusFilter}
          onChange={handleStatusChange}
        >
          <option value="">Toate Statusurile</option>
          <option value="proiect">Proiect</option>
          <option value="comanda_spre_finalizare">Comandă spre Finalizare</option>
          <option value="oferta_acceptata">Ofertă Acceptată</option>
          <option value="oferta_respinsa">Ofertă Respinsă</option>
        </select>
        <div>
          <button
            className="btn btn-outline-primary me-2"
            onClick={() => handleExport("csv")}
          >
            Export CSV
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => handleExport("pdf")}
          >
            Export PDF
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
                    <td>
                      <Link
                        to={`/offer/${offer._id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Detalii
                      </Link>
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
