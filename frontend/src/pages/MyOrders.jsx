import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Table, Container, Button, Alert, Spinner } from "react-bootstrap";

const MyOrders = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://localhost:5000/api/orders/client/orders${
          statusFilter ? `?status=${statusFilter}` : ""
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  return (
    <Container className="py-5">
      <h2 className="text-center mb-4">Cererile Mele de Oferte</h2>

      {/* Afișare eroare */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filtrare după status */}
      <div className="mb-3 d-flex justify-content-end">
        <select
          className="form-select w-auto"
          value={statusFilter}
          onChange={handleStatusChange}
        >
          <option value="">Toate</option>
          <option value="asteptare_oferta">În așteptare</option>
          <option value="ofertat">Ofertat</option>
          <option value="comanda_spre_finalizare">Spre finalizare</option>
          <option value="finalizare">Finalizat</option>
          <option value="livrat">Livrat</option>
        </select>
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
                <td>{index + 1}</td>
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
                    to={`/my-orders/${order._id}`}
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
    </Container>
  );
};

export default MyOrders;
