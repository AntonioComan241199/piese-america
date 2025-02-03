import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { checkAuth } from "../slices/authSlice";
const API_URL = import.meta.env.VITE_API_URL;


const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { token, authChecked } = useSelector((state) => state.auth);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchWithAuth(`${API_URL}/order/admin`);
      setOrders(data.data);
    } catch (err) {
      setError(err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (!token) {
        await dispatch(checkAuth());
      }
    };

    initialize();
  }, [dispatch, token]);

  useEffect(() => {
    if (authChecked && token) {
      fetchOrders();
    } else if (authChecked && !token) {
      setError("No access token available. Please log in again.");
    }
  }, [authChecked, token]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/order/${orderId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
          headers: { "Content-Type": "application/json" },
        }
      );

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: response.data.status } : order
        )
      );

      if (response.data.offerId) {
        await fetchWithAuth(
          `${API_URL}/offer/status/${response.data.offerId}`,
          {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus }),
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await fetchWithAuth(`${API_URL}/order/${orderId}`, {
        method: "DELETE",
      });
      setOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId));
    } catch (err) {
      setError(err.message || "Failed to delete order");
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ["ID Cerere", "Client", "Telefon", "Email", "Mașină", "Status", "Data", "Oferta"],
      ...orders.map((order) => [
        order.orderNumber || order._id,
        `${order.firstName} ${order.lastName}`,
        order.phoneNumber,
        order.email,
        `${order.carMake} ${order.carModel}`,
        order.status,
        new Date(order.orderDate).toLocaleDateString(),
        order.offerId ? "Exista" : "Nu exista",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container my-4">
      <h2 className="text-center mb-4">Toate comenzile</h2>
      {loading && <div className="alert alert-info">Se încarcă comenzile...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="mb-3 text-end">
        <button onClick={exportToCSV} className="btn btn-primary">
          Export Comenzi
        </button>
      </div>
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              <th>ID Cerere</th>
              <th>Client</th>
              <th>Telefon</th>
              <th>Email</th>
              <th>Mașină</th>
              <th>Status</th>
              <th>Data</th>
              <th>Oferta</th>
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order.orderNumber ? `#${order.orderNumber}` : order._id}</td>
                <td>{order.firstName} {order.lastName}</td>
                <td>{order.phoneNumber}</td>
                <td>{order.email}</td>
                <td>{order.carMake} {order.carModel}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    className="form-select form-select-sm"
                  >
                    <option value="in_asteptare">In asteptare</option>
                    <option value="ofertat">Ofertat</option>
                    <option value="oferta_acceptata">Oferta acceptata</option>
                    <option value="oferta_respinsa">Oferta respinsa</option>
                    <option value="in_livrare">In livrare</option>
                    <option value="livrat">Livrat</option>
                  </select>
                </td>
                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                <td>
                  {order.offerId ? (
                    <button
                      onClick={() => window.open(`/offer-detail/${order.offerId}`, "_blank")}
                      className="btn btn-info btn-sm"
                    >
                      Vezi Oferta
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => window.open(`/offer-generator/${order._id}`, "_blank")}
                    >
                      Generează Ofertă
                    </button>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => {
                      if (window.confirm("Ești sigur că vrei să ștergi comanda?")) {
                        deleteOrder(order._id);
                      }
                    }}
                    className="btn btn-danger btn-sm me-2"
                  >
                    Șterge
                  </button>
                  <button
                    onClick={() => window.open(`/order-detail/${order._id}`, "_blank")}
                    className="btn btn-success btn-sm"
                  >
                    Detalii
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllOrders;
