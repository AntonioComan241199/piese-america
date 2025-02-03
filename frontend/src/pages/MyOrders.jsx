import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Table, Container, Button, Alert, Spinner } from "react-bootstrap";
const API_URL = import.meta.env.VITE_API_URL;


const MyOrders = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orderNumberFilter, setOrderNumberFilter] = useState(""); // Filtru pentru numărul comenzii
  const [orderDateFilter, setOrderDateFilter] = useState(""); // Filtru pentru data comenzii
  const [currentPage, setCurrentPage] = useState(1); // Paginare
  const [totalPages, setTotalPages] = useState(1); // Total pagini

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, statusFilter, orderNumberFilter, orderDateFilter, currentPage]); // Adăugăm currentPage ca dependență

  const fetchOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${API_URL}/orders/client/orders${
          statusFilter || orderNumberFilter || orderDateFilter
            ? `?status=${statusFilter}&orderNumber=${orderNumberFilter}&orderDate=${orderDateFilter}&page=${currentPage}`
            : `?page=${currentPage}`
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Eroare la încărcarea cererilor.");
      }

      const data = await response.json();
      setOrders(data.data || []);
      setTotalPages(data.pagination.pages || 1); // Actualizăm totalPages
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleOrderNumberChange = (e) => {
    setOrderNumberFilter(e.target.value); // Actualizează numărul comenzii
  };

  const handleOrderDateChange = (e) => {
    setOrderDateFilter(e.target.value); // Actualizează data comenzii
  };

  const handleResetFilters = () => {
    setStatusFilter("");
    setOrderNumberFilter("");
    setOrderDateFilter(""); // Resetăm toate filtrele
    setCurrentPage(1); // Resetăm și pagina la 1
    fetchOrders(); // Reîncarcă comenzile fără filtre
  };

  const handlePageChange = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <Container className="py-5">
      <h2 className="text-center mb-4">Cererile Mele de Oferte</h2>

      {/* Afișare eroare */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filtrare după număr comandă, status și dată */}
      <div className="mb-3">
        <div className="d-flex flex-wrap align-items-center">
          <select
            className="form-select w-auto me-2"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <option value="">Toate Statusurile</option>
            <option value="asteptare_oferta">Așteptare ofertă</option>
            <option value="ofertat">Ofertat</option>
            <option value="oferta_acceptata">Oferta Acceptata</option>
            <option value="livrare_in_procesare">Livrare în Procesare</option>
            <option value="livrata">Livrată</option>
            <option value="anulata">Anulată</option>
          </select>

          <input
            type="number"
            className="form-control w-auto me-2"
            placeholder="Număr Comandă"
            value={orderNumberFilter}
            onChange={handleOrderNumberChange}
          />

          <input
            type="date"
            className="form-control w-auto me-2"
            value={orderDateFilter}
            onChange={handleOrderDateChange}
          />

          <button className="btn btn-outline-primary ms-2" onClick={fetchOrders}>
            Aplică Filtre
          </button>
          <button className="btn btn-outline-danger ms-2" onClick={handleResetFilters}>
            Șterge Filtre
          </button>
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      )}

      {/* Tabel de cereri */}
      {!loading && orders.length > 0 && (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Număr Cerere</th>
              <th>Mașină</th>
              <th>Status</th>
              <th>Dată Cerere</th>
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order._id}>
                <td>{(currentPage - 1) * 10 + index + 1}</td>
                <td>{order.orderNumber}</td>
                <td>
                  {order.carYear} {order.carMake} {order.carModel}
                </td>
                <td>
                  <span
                    className={`badge ${
                      order.status === "finalizare"
                        ? "bg-success"
                        : order.status === "ofertat"
                        ? "bg-info"
                        : "bg-warning"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                <td>
                  <Link
                    to={`/orders/${order._id}`}
                    className="btn btn-primary btn-sm"
                  >
                    Detalii
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Fără cereri */}
      {!loading && orders.length === 0 && (
        <p className="text-center">Nu ai trimis încă nicio cerere de ofertă.</p>
      )}

      {/* Paginare */}
      {!loading && orders.length > 0 && (
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
      )}
    </Container>
  );
};

export default MyOrders;
