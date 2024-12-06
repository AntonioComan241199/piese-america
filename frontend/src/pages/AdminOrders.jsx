import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import CreateOfferModal from "./CreateOfferModal"; // Importul modalului

const AdminOrders = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");  // Filtru status cerere
  const [offerNumber, setOfferNumber] = useState("");   // Filtru număr ofertă
  const [startDate, setStartDate] = useState("");       // Filtru dată start
  const [endDate, setEndDate] = useState("");           // Filtru dată sfârșit
  const [currentPage, setCurrentPage] = useState(1);    // Paginare
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);  // Orderul selectat pentru crearea ofertei
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);  // Control pentru modal

  // Funcția de obținere a cererilor
  const fetchOrders = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Trebuie să fiți autentificat pentru a accesa cererile.");
      setLoading(false);
      return;
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const url = new URL("http://localhost:5000/api/orders/admin");
      url.searchParams.append("page", currentPage);
      url.searchParams.append("status", statusFilter);
      url.searchParams.append("offerNumber", offerNumber);
      url.searchParams.append("startDate", startDate);
      url.searchParams.append("endDate", endDate);

      const response = await fetch(url.toString(), { method: "GET", headers });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Eroare la obținerea cererilor.");
      }

      const data = await response.json();
      setOrders(data.data || []);
      setTotalPages(data.pagination.pages || 1);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setError("Trebuie să fiți autentificat pentru a accesa cererile.");
      setLoading(false);
    }
  }, [isAuthenticated, currentPage, statusFilter, offerNumber, startDate, endDate]);

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1);  // Resetăm la prima pagină
  };

  const handlePageChange = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter("");
    setOfferNumber("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);  // Resetăm filtrele și pagina
  };

  const openCreateOfferModal = (order) => {
    setSelectedOrder(order);
    setShowCreateOfferModal(true);
  };

  const closeCreateOfferModal = () => {
    setSelectedOrder(null);
    setShowCreateOfferModal(false);
  };

  const handleOfferCreated = (createdOffer) => {
    // Actualizează lista de comenzi după crearea ofertei
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === createdOffer.orderId
          ? { ...order, offerId: createdOffer._id, status: "ofertat" }
          : order
      )
    );
    closeCreateOfferModal();
  };

  if (loading) return <div className="text-center">Se încarcă...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Gestionare Cereri</h2>

      {/* Filtrele */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div className="d-flex flex-wrap">
          <select
            className="form-select w-auto me-2"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <option value="">Toate Statusurile</option>
            <option value="asteptare_oferta">Așteptare ofertă</option>
            <option value="ofertat">Ofertat</option>
            <option value="comanda_spre_finalizare">Comandă spre Finalizare</option>
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
            placeholder="Data Start"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="form-control w-auto me-2"
            placeholder="Data Sfârșit"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button className="btn btn-outline-secondary" onClick={handleResetFilters}>
            Resetare Filtre
          </button>
        </div>
      </div>

      {/* Tabel cu cereri */}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>Număr Cerere</th>
              <th>Client</th>
              <th>Status</th>
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order._id}>
                <td>{(currentPage - 1) * 10 + index + 1}</td>
                <td>
                  <Link to={`/orders/${order._id}`}>#{order.orderNumber}</Link>
                </td>
                <td>
                  {order.userType === "persoana_fizica"
                    ? `${order.firstName} ${order.lastName}`
                    : order.companyDetails?.companyName}
                </td>
                <td>{order.status}</td>
                <td>
                  <Link to={`/orders/${order._id}`} className="btn btn-primary btn-sm">
                    Detalii
                  </Link>
                  {/* Butonul de creare ofertă se afișează doar dacă statusul este "asteptare_oferta" */}
                  {order.status === "asteptare_oferta" && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => openCreateOfferModal(order)}
                    >
                      Creează Ofertă
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {/* Modalul de creare ofertă */}
      <CreateOfferModal
        show={showCreateOfferModal}
        onHide={closeCreateOfferModal}
        onCreateOffer={handleOfferCreated} // Callback pentru actualizare
        order={selectedOrder}
      />
    </div>
  );
};

export default AdminOrders;
