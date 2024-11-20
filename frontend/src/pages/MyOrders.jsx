import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const { token } = useSelector((state) => state.auth); // Obține token-ul de autentificare

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/order/client", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Trimite token-ul în header
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch orders");
        }

        const data = await response.json();
        setOrders(data.data); // Setează comenzile
      } catch (err) {
        setError(err.message);
      }
    };

    fetchOrders();
  }, [token]);

  return (
    <div className="orders-container">
      <h2>Comenzile mele</h2>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Mașină</th>
            <th>Status</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>{order.carMake} {order.carModel}</td>
              <td>{order.status}</td>
              <td>{new Date(order.orderDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MyOrders;
