import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import CreateOfferModal from "./CreateOfferModal"; // Importul modalului

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const isClient = user?.role === "client";
  const isAdmin = user?.role === "admin";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false); // Stare pentru modal

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const headers = { "Content-Type": "application/json" };
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

  const getOfferStatus = (order) => {
    if (!order.offerId) return "În așteptarea ofertei";
    if (order.status === "oferta_acceptata") return "Ofertă acceptată";
    if (order.status === "ofertat") return "Ofertat - În așteptarea selecției pieselor dorite";
    if (order.status === "anulata") return "Ofertă anulată";
    return "Status necunoscut";
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
  
    setAddingComment(true);
  
    try {
      const headers = { "Content-Type": "application/json" };
      const token = localStorage.getItem("accessToken");
      if (isAuthenticated && token) {
        headers.Authorization = `Bearer ${token}`;
      }
  
      console.log("Payload trimis:", { text: newComment }); // Debug
  
      const response = await fetch(`http://localhost:5000/api/orders/client/orders/${id}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text: newComment }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Eroare la adăugarea comentariului.");
      }
  
      const updatedComments = await response.json();
      console.log("Comentarii actualizate:", updatedComments); // Debug
  
      setOrder((prevOrder) => ({
        ...prevOrder,
        comments: updatedComments.comments,
      }));
  
      setNewComment("");
    } catch (error) {
      setError(error.message);
    } finally {
      setAddingComment(false);
    }
  };
  

  const redirectToOffer = () => {
    if (order.offerId) {
      navigate(`/offer/${order.offerId._id}`);
    }
  };

  // Funcția pentru deschiderea/modalul pentru crearea ofertei
  const handleCreateOffer = () => {
    console.log("Apăsat pe Creează ofertă");
    setShowCreateOfferModal(true);
    console.log("Starea modalului:", showCreateOfferModal);
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
        {/* Informații utilizator */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="m-0">Informații utilizator</h5>
          </div>
          <div className="card-body">
            {order.userType === "persoana_fizica" ? (
              <>
                <p><strong>Prenume:</strong> {order.firstName || "N/A"}</p>
                <p><strong>Nume:</strong> {order.lastName || "N/A"}</p>
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
          </div>
        </div>

        {/* Informații vehicul */}
        <div className="card mb-4">
          <div className="card-header bg-secondary text-white">
            <h5 className="m-0">Informații vehicul</h5>
          </div>
          <div className="card-body">
            <p><strong>An fabricație:</strong> {order.carYear}</p>
            <p><strong>Marcă:</strong> {order.carMake}</p>
            <p><strong>Model:</strong> {order.carModel}</p>
            <p><strong>Tip combustibil:</strong> {order.fuelType}</p>
            <p><strong>Capacitate cilindrică:</strong> {order.engineSize} cm³</p>
            <p><strong>Putere motor:</strong> {order.enginePower} CP</p>
            <p><strong>Cutie de viteze:</strong> {order.transmission}</p>
            <p><strong>VIN:</strong> {order.vin}</p>
            <p><strong>Detalii piesă:</strong> {order.partDetails}</p>
          </div>
        </div>

        {/* Informații ofertă */}
        <div className="card mb-4">
          <div className="card-header bg-warning text-white">
            <h5 className="m-0">Informații ofertă</h5>
          </div>
          <div className="card-body">
            {order.offerId ? (
              <>
                <p><strong>Status:</strong> {getOfferStatus(order)}</p>

                {isClient && order.status === "ofertat" && (
                  <div className="alert alert-warning">
                    <strong>Atenție!</strong> Te rugăm să selectezi piesele dorite din oferta disponibilă.
                  </div>
                )}

                {isClient && order.status === "oferta_acceptata" && (
                  <div className="alert alert-success">
                    <strong>Felicitări!</strong> Ai acceptat oferta, te rugăm să aștepți procesarea comenzii.
                  </div>
                )}

                {isAdmin && order.status === "asteptare_oferta" && (
                  <button className="btn btn-success" onClick={handleCreateOffer}>
                    Creează ofertă
                  </button>
                )}

                <p><strong>Număr ofertă:</strong> {order.offerId.offerNumber}</p>
                <p><strong>Total ofertă:</strong> {order.status === "ofertat" ? "Așteptare selecție piese" : `${order.offerId.total} RON`}</p>
                
                {isClient && order.status === "ofertat" && (
                  <button className="btn btn-primary" onClick={redirectToOffer}>
                    Selectează piesele dorite
                  </button>
                )}

                {isAdmin && order.status === "ofertat" && (
                  <button className="btn btn-primary" onClick={redirectToOffer}>
                    Vezi Oferta - Selectie piese client
                  </button>
                )}

                {order.status === "oferta_acceptata" && (
                  <button className="btn btn-primary" onClick={redirectToOffer}>
                    Vezi oferta acceptată
                  </button>
                )}
              </>
            ) : (
              <p><strong>Status ofertă:</strong> În așteptarea ofertei</p>
            )}
            {isAdmin && order.status === "asteptare_oferta" && (
                  <button className="btn btn-success" onClick={handleCreateOffer}>
                    Creează ofertă
                  </button>
                )}
          </div>
        </div>

        {/* Secțiunea comentarii */}
        <div className="card">
          <div className="card-header bg-info text-white">
            <h5 className="m-0">Comentarii</h5>
          </div>
          <div className="card-body">
            {order.comments && order.comments.length > 0 ? (
              order.comments.map((comment, index) => (
                <div key={index} className="mb-3">
                  <p>
                    <strong>{comment.user || "Anonim"}</strong> ({new Date(comment.date).toLocaleString()}):
                  </p>
                  <p>{comment.text}</p>
                </div>
              ))
            ) : (
              <p>Nu există comentarii.</p>
            )}
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

      {/* Modal pentru creare ofertă */}
      {showCreateOfferModal && (
        <CreateOfferModal
          show={showCreateOfferModal} // Trimite proprietatea pentru afișare
          onHide={() => setShowCreateOfferModal(false)} // Închide modalul
          order={order} // Trimite detaliile comenzii curente
          onCreateOffer={(createdOffer) => {
            console.log("Ofertă creată:", createdOffer);

            // Actualizează starea comenzii pentru a reflecta oferta creată
            setOrder((prevOrder) => ({
              ...prevOrder,
              offerId: createdOffer, // Adaugă oferta creată la comanda curentă
              status: "ofertat", // Sau orice alt status relevant
            }));

            setShowCreateOfferModal(false); // Închide modalul după succes
          }}
        />
      )}
    </div>
  );
};

export default OrderDetails;
