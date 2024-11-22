import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Pentru a obține parametrii din URL

const OrderDetails = () => {
  const { id } = useParams(); // Preia ID-ul comenzii din URL
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Funcția pentru a prelua detaliile comenzii
  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/order/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch order details");
      }

      const data = await response.json();
      setOrder(data.data); // Setează datele comenzii
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails(); // Fetch comanda când componenta este montată
  }, [id]);

  if (loading) {
    return <div className="text-center">Se încarcă detaliile comenzii...</div>;
  }

  if (error) {
    return <div className="alert alert-danger text-center">{error}</div>;
  }

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Detalii comandă</h2>
      {order && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h4>Informații client</h4>
              </div>
              <div className="card-body">
                <p><strong>Prenume:</strong> {order.firstName}</p>
                <p><strong>Nume:</strong> {order.lastName}</p>
                <p><strong>Email:</strong> {order.email}</p>
                <p><strong>Telefon:</strong> {order.phoneNumber}</p>
              </div>
            </div>
          </div>

          <div className="col-12 mt-4">
            <div className="card">
              <div className="card-header">
                <h4>Informații mașină</h4>
              </div>
              <div className="card-body">
                <p><strong>Marca:</strong> {order.carMake}</p>
                <p><strong>Model:</strong> {order.carModel}</p>
                <p><strong>An fabricație:</strong> {order.carYear}</p>
                <p><strong>Motorizare:</strong> {order.fuelType}</p>
                <p><strong>Capacitate cilindrică:</strong> {order.engineSize} cm³</p>
                <p><strong>Cutie de viteze:</strong> {order.transmission}</p>
                <p><strong>VIN:</strong> {order.vin}</p>
              </div>
            </div>
          </div>

          <div className="col-12 mt-4">
            <div className="card">
              <div className="card-header">
                <h4>Detalii piesă comandată</h4>
              </div>
              <div className="card-body">
                <p><strong>Detalii piesă:</strong> {order.partDetails}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Data comenzii:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
