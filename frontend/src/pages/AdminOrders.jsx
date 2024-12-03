import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import CreateOfferModal from "./CreateOfferModal";

const AdminOrders = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
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

        const response = await fetch(
          `http://localhost:5000/api/orders/admin?page=${currentPage}`,
          {
            method: "GET",
            headers,
          }
        );

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

    if (isAuthenticated) {
      fetchOrders();
    } else {
      setError("Trebuie să fiți autentificat pentru a accesa cererile.");
      setLoading(false);
    }
  }, [isAuthenticated, currentPage]);

  const handlePageChange = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
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
      {orders.length > 0 ? (
        <>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nume Client</th>
                  <th>Email</th>
                  <th>Telefon</th>
                  <th>Status</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order._id}>
                    <td>{(currentPage - 1) * 10 + index + 1}</td>
                    <td>
                      {order.userType === "persoana_fizica"
                        ? `${order.firstName} ${order.lastName}`
                        : order.companyDetails?.companyName || "N/A"}
                    </td>
                    <td>{order.email}</td>
                    <td>{order.phoneNumber}</td>
                    <td>{order.status}</td>
                    <td>
                      <Link
                        to={`/orders/${order._id}`}
                        className="btn btn-primary btn-sm me-2"
                      >
                        Detalii
                      </Link>
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
        </>
      ) : (
        <div className="alert alert-info text-center">
          Nu există cereri disponibile.
        </div>
      )}

      {/* Modal pentru creare ofertă */}
      <CreateOfferModal
        show={!!selectedOrder}
        onHide={closeCreateOfferModal}
        onCreateOffer={handleOfferCreated} // Callback pentru actualizare
        order={selectedOrder}
      />
    </div>
  );
};

export default AdminOrders;
