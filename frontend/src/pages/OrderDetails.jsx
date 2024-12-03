import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

const OrderDetails = () => {
  const { id } = useParams();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
        };
        const token = localStorage.getItem("accessToken");
        if (isAuthenticated && token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`http://localhost:5000/api/orders/client/orders/${id}`, {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Eroare la obținerea detaliilor cererii.");
        }

        const data = await response.json();
        setOrder(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, isAuthenticated]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setAddingComment(true);

    try {
      const headers = {
        "Content-Type": "application/json",
      };
      const token = localStorage.getItem("accessToken");
      if (isAuthenticated && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5000/api/orders/client/orders/${id}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text: newComment }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Eroare la adăugarea comentariului.");
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      setNewComment("");
    } catch (error) {
      setError(error.message);
    } finally {
      setAddingComment(false);
    }
  };

  if (loading) {
    return <div className="text-center">Se încarcă...</div>;
  }

  if (error) {
    return <div className="alert alert-danger text-center">{error}</div>;
  }

  if (!order || typeof order !== "object") {
    return <div className="alert alert-warning text-center">Detalii cerere indisponibile.</div>;
  }

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Detalii cerere #{order.orderNumber}</h2>
      <div className="shadow p-4 rounded bg-light">
        <h4>Informații utilizator</h4>
        {order.userType === "persoana_fizica" ? (
          <>
            <p><strong>Prenume:</strong> {order.firstName}</p>
            <p><strong>Nume:</strong> {order.lastName}</p>
          </>
        ) : (
          <>
            <p><strong>Numele firmei:</strong> {order.companyDetails?.companyName || "N/A"}</p>
            <p><strong>CUI:</strong> {order.companyDetails?.cui || "N/A"}</p>
            <p><strong>Nr. Reg. Comerț:</strong> {order.companyDetails?.nrRegCom || "N/A"}</p>
          </>
        )}
        <p><strong>Email:</strong> {order.email}</p>
        <p><strong>Telefon:</strong> {order.phoneNumber}</p>

        <hr />
        <h4>Informații vehicul</h4>
        <p><strong>An fabricație:</strong> {order.carYear}</p>
        <p><strong>Marcă:</strong> {order.carMake}</p>
        <p><strong>Model:</strong> {order.carModel}</p>
        <p><strong>Tip combustibil:</strong> {order.fuelType}</p>
        <p><strong>Capacitate cilindrică:</strong> {order.engineSize} cm³</p>
        <p><strong>Putere motor:</strong> {order.enginePower} CP</p>
        <p><strong>Cutie de viteze:</strong> {order.transmission}</p>
        <p><strong>VIN:</strong> {order.vin}</p>
        <hr />
        <p><strong>Detalii piesă:</strong> {order.partDetails}</p>

        <hr />
        <h4>Comentarii</h4>
        {order.comments && order.comments.length > 0 ? (
          order.comments.map((comment, index) => (
            <div key={index} className="mb-3">
              <p>
                <strong>{comment.user}</strong> ({new Date(comment.date).toLocaleString()}):
              </p>
              <p>{comment.text}</p>
            </div>
          ))
        ) : (
          <p>Nu există comentarii.</p>
        )}

        <div className="mt-4">
          <h5>Adaugă un comentariu</h5>
          <textarea
            className="form-control mb-3"
            rows="3"
            placeholder="Scrie un comentariu..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={addingComment}
          ></textarea>
          <button
            className="btn btn-primary"
            onClick={handleAddComment}
            disabled={addingComment}
          >
            {addingComment ? "Se adaugă..." : "Adaugă comentariu"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
