import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { checkAuth } from "../slices/authSlice";

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  const fetchOrders = async () => {
    setLoading(true);
    setError(""); // Resetează eroarea înainte de fiecare apel
    try {
      const data = await fetchWithAuth("http://localhost:5000/api/order/admin");
      setOrders(data.data); // presupunem că datele sunt în `data.data`
    } catch (err) {
      setError(err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAndFetch = async () => {
      // Asigură-te că token-ul este verificat
      if (!token) {
        await dispatch(checkAuth());
      }
      // Dacă există token, începe procesul de preluare a comenzilor
      if (token) {
        fetchOrders();
      } else {
        setError("No access token available. Please log in again.");
      }
    };

    checkAndFetch();
  }, [token, dispatch]); // Monitorizează modificările stării `token` și `dispatch`

  const updateStatus = async (orderId, newStatus) => {
    try {
      const updatedOrder = await fetchWithAuth(
        `http://localhost:5000/api/order/${orderId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        }
      );
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: updatedOrder.data.status } : order
        )
      );
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await fetchWithAuth(`http://localhost:5000/api/order/${orderId}`, {
        method: "DELETE",
      });
      setOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId));
    } catch (err) {
      setError(err.message || "Failed to delete order");
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Client", "Phone", "Email", "Mașină", "Status", "Data"],
      ...orders.map((order) => [
        `${order.firstName} ${order.lastName}`,
        order.phoneNumber,
        order.email,
        `${order.carMake} ${order.carModel}`,
        order.status,
        new Date(order.orderDate).toLocaleDateString(),
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
