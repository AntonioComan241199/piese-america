import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useSelector } from "react-redux";

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [comment, setComment] = useState("");
  const [commentUser, setCommentUser] = useState("");
  const { user } = useSelector((state) => state.auth); // Obține detaliile utilizatorului din Redux

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetchWithAuth(`http://localhost:5000/api/order/${id}`);
        setOrder(response.data);
      } catch (err) {
        setError(err.message || "Nu s-au putut prelua detaliile comenzii.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const updateOrderStatus = async (newStatus) => {
    if (user?.role !== "admin") {
      alert("Doar administratorii pot schimba statusul comenzii.");
      return;
    }

    if (!window.confirm(`Ești sigur că vrei să actualizezi statusul la '${newStatus}'?`)) return;

    setUpdatingStatus(true);
    try {
      const response = await fetchWithAuth(`http://localhost:5000/api/order/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setOrder((prevOrder) => ({ ...prevOrder, status: response.data.status }));
    } catch (err) {
      alert("Eroare la actualizarea statusului: " + (err.message || "Unknown error"));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const addComment = async () => {
    if (!comment || !commentUser) {
      alert("Te rugăm să completezi toate câmpurile pentru comentariu.");
      return;
    }
  
    try {
      const response = await fetchWithAuth(
        `http://localhost:5000/api/order/${id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ text: comment, user: commentUser }), // Asigură-te că body-ul este JSON
        }
      );
  
      setOrder((prevOrder) => ({
        ...prevOrder,
        comments: response.data,
      }));
      setComment("");
      setCommentUser("");
    } catch (err) {
      alert("Eroare la adăugarea comentariului: " + err.message);
    }
  };

  const copyClientInfo = () => {
    const clientInfo = `
      Nume: ${order.firstName} ${order.lastName}
      Telefon: ${order.phoneNumber}
      Email: ${order.email}
    `;
    navigator.clipboard.writeText(clientInfo);
    alert("Informațiile clientului au fost copiate în clipboard!");
  };

  if (loading) return <div className="alert alert-info">Se încarcă detaliile comenzii...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!order) return <div className="alert alert-warning">Comanda nu a fost găsită!</div>;

  return (
    <div className="container my-4">
      <h2 className="text-center mb-4">Detalii Comandă</h2>
      <table className="table table-striped table-bordered">
        <tbody>
          <tr>
            <th>Nume Client</th>
            <td>
              {order.firstName} {order.lastName}
              <button
                onClick={copyClientInfo}
                className="btn btn-link btn-sm text-primary ms-2"
              >
                Copiază
              </button>
            </td>
          </tr>
          <tr>
            <th>Email</th>
            <td>
              <a href={`mailto:${order.email}`} className="text-decoration-none">
                {order.email}
              </a>
            </td>
          </tr>
          <tr>
            <th>Telefon</th>
            <td>{order.phoneNumber}</td>
          </tr>
          <tr>
            <th>Mașină</th>
            <td>{order.carMake} {order.carModel} ({order.carYear})</td>
          </tr>
          <tr>
            <th>Motorizare</th>
            <td>{order.fuelType} - {order.engineSize} cm³</td>
          </tr>
          <tr>
            <th>Cutie de viteze</th>
            <td>{order.transmission}</td>
          </tr>
          <tr>
            <th>VIN</th>
            <td>{order.vin}</td>
          </tr>
          <tr>
            <th>Detalii Piesă</th>
            <td>{order.partDetails}</td>
          </tr>
          <tr>
            <th>Status</th>
            <td>
              <div className="d-flex align-items-center">
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
                {user?.role === "admin" && (
                  <div className="ms-3">
                    <button
                      className="btn btn-sm btn-outline-success me-2"
                      disabled={updatingStatus || order.status === "completed"}
                      onClick={() => updateOrderStatus("completed")}
                    >
                      Completează
                    </button>
                    <button
                      className="btn btn-sm btn-outline-warning"
                      disabled={updatingStatus || order.status === "processed"}
                      onClick={() => updateOrderStatus("processed")}
                    >
                      Procesează
                    </button>
                  </div>
                )}
              </div>
            </td>
          </tr>
          <tr>
            <th>Data</th>
            <td>{new Date(order.orderDate).toLocaleDateString("ro-RO", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</td>
          </tr>
        </tbody>
      </table>

      {/* Comentarii */}
      <div className="my-4">
        <h4>Comentarii</h4>
        {order.comments?.length > 0 ? (
          <ul className="list-group">
            {order.comments.map((comment, index) => (
              <li key={index} className="list-group-item">
                <strong>{comment.user}:</strong> {comment.text} <br />
                <small>{new Date(comment.date).toLocaleString("ro-RO")}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nu există comentarii pentru această comandă.</p>
        )}
        <div className="mt-3">
          <input
            type="text"
            placeholder="Nume utilizator"
            value={commentUser}
            onChange={(e) => setCommentUser(e.target.value)}
            className="form-control mb-2"
          />
          <textarea
            placeholder="Scrie un comentariu..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="form-control mb-2"
            rows="3"
          ></textarea>
          <button onClick={addComment} className="btn btn-primary">
            Adaugă Comentariu
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
