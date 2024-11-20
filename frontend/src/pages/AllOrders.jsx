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
    <div className="p-6 flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-6">Toate comenzile</h2>
      {loading && <p className="text-blue-500">Se încarcă comenzile...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <button
        onClick={exportToCSV}
        className="mb-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
      >
        Export Comenzi
      </button>
      <div className="overflow-x-auto w-full">
        <table className="min-w-full table-auto border-collapse border border-gray-300 text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Client</th>
              <th className="border px-4 py-2">Phone</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Mașină</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Data</th>
              <th className="border px-4 py-2">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">
                  {order.firstName} {order.lastName}
                </td>
                <td className="border px-4 py-2">{order.phoneNumber}</td>
                <td className="border px-4 py-2">{order.email}</td>
                <td className="border px-4 py-2">
                  {order.carMake} {order.carModel}
                </td>
                <td className="border px-4 py-2">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    className="bg-white border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="processed">Processed</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td className="border px-4 py-2">
                  {new Date(order.orderDate).toLocaleDateString()}
                </td>
                <td className="border px-4 py-2 space-x-2">
                  <button
                    onClick={() => {
                      if (window.confirm("Esti sigur ca vrei sa stergi comanda?")) {
                        deleteOrder(order._id);
                      }
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Șterge
                  </button>
                  <button
                    onClick={() => window.open(`/order-detail/${order._id}`, "_blank")}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
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
