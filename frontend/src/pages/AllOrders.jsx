import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { checkAuth } from "../slices/authSlice";

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { token, authChecked, loading: authLoading } = useSelector((state) => state.auth);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchWithAuth("http://localhost:5000/api/order/admin");
      setOrders(data.data);
    } catch (err) {
      setError(err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verifică autentificarea dacă nu a fost verificată
    if (!authChecked) {
      dispatch(checkAuth());
    }
  }, [dispatch, authChecked]);

  useEffect(() => {
    // Încarcă comenzile doar după ce autentificarea este verificată și token-ul este disponibil
    if (authChecked && token) {
      fetchOrders();
    } else if (authChecked && !token) {
      setError("No access token available. Please log in again.");
    }
  }, [authChecked, token]);

  if (authLoading || loading) {
    return <div className="alert alert-info">Se încarcă comenzile...</div>;
  }

  return (
    <div className="container my-4">
      <h2 className="text-center mb-4">Toate comenzile</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              <th>Client</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Mașină</th>
              <th>Status</th>
              <th>Data</th>
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>
                  {order.firstName} {order.lastName}
                </td>
                <td>{order.phoneNumber}</td>
                <td>{order.email}</td>
                <td>
                  {order.carMake} {order.carModel}
                </td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    className="form-select form-select-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="processed">Processed</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
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
