import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useSelector((state) => state.auth);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/order/admin", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/order/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      const updatedOrder = await response.json();
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: updatedOrder.data.status } : order
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/order/${orderId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete order");
      }

      setOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId));
    } catch (err) {
      setError(err.message);
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

  useEffect(() => {
    fetchOrders();
  }, [token]);

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
                    <option value="pending">Pending</option>
                    <option value="processed">Processed</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => {
                      if (window.confirm("Esti sigur ca vrei sa stergi comanda?")) {
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
