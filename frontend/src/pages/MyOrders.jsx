import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useNavigate } from "react-router-dom";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchWithAuth("http://localhost:5000/api/order/client");
        setOrders(data.data);
      } catch (err) {
        setError(err.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchOrders();
    } else {
      setError("No authentication token found. Please log in again.");
    }
  }, [token]);

  const handleViewDetails = (orderId) => {
    navigate(`/order-detail/${orderId}`); // Navighează la pagina detaliilor comenzii
  };

  return (
    <div className="container my-4">
      <h2 className="text-center mb-4">Comenzile Mele</h2>

      {/* Feedback de eroare */}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Feedback de încărcare */}
      {loading && <div className="alert alert-info">Se încarcă comenzile...</div>}

      {/* Mesaj când nu există comenzi */}
      {!loading && !error && orders.length === 0 && (
        <div className="alert alert-warning text-center">
          Nu aveți comenzi înregistrate momentan.
        </div>
      )}

      {/* Tabelul comenzilor */}
      {!loading && !error && orders.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
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
                    {order.carMake} {order.carModel}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        order.status === "completed"
                          ? "bg-success"
                          : order.status === "processed"
                          ? "bg-warning"
                          : "bg-secondary"
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td>{new Date(order.orderDate).toLocaleDateString("ro-RO")}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleViewDetails(order._id)}
                    >
                      Vezi Detalii
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
