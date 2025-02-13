import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchWithAuth } from "../../utils/fetchWithAuth";
const API_URL = import.meta.env.VITE_API_URL;


const OfferGenerator = () => {
  const { orderId } = useParams(); // Extrage `orderId` din URL
  const [order, setOrder] = useState(null); // Datele despre comandă
  const [offer, setOffer] = useState(null); // Datele despre oferta curentă
  const [loading, setLoading] = useState(true); // Starea de încărcare
  const [error, setError] = useState(""); // Mesaj de eroare
  const [parts, setParts] = useState([]); // Lista pieselor din ofertă
  const [total, setTotal] = useState(0); // Totalul ofertei
  const [message, setMessage] = useState(""); // Mesaj de succes/eroare

  // Fetch detalii comandă și ofertă
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const orderResponse = await fetchWithAuth(`${API_URL}/order/${orderId}`);
        setOrder(orderResponse.data);

        // Verificăm dacă există deja o ofertă pentru această comandă
        const offerResponse = await fetchWithAuth(`${API_URL}/offer/order/${orderId}`);
        if (offerResponse.length > 0) {
          setOffer(offerResponse[0]); // Afișăm doar prima ofertă asociată
          setParts(offerResponse[0].parts);
          setTotal(offerResponse[0].total);
        }
      } catch (error) {
        setError("Nu s-au putut încărca detaliile comenzii. Verifică conexiunea sau încearcă din nou.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  // Adaugă o piesă nouă în ofertă
  const handleAddPart = () => {
    setParts([...parts, { name: "", code: "", value: 0, quantity: 1, partType: "" }]);
  };

  // Gestionează modificările pentru o piesă
  const handlePartChange = (index, field, value) => {
    const updatedParts = [...parts];
    updatedParts[index][field] = value;
    setParts(updatedParts);

    // Recalculează totalul
    const updatedTotal = updatedParts.reduce((sum, part) => sum + part.value * part.quantity, 0);
    setTotal(updatedTotal);
  };

  // Trimite oferta către backend
  const handleSubmitOffer = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/offer/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, parts, total }),
      });

      // Actualizează statusul cererii de ofertare
      await fetchWithAuth(`${API_URL}/order/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "oferta_trimisa" }),
      });

      setMessage("Oferta a fost creată și statusul cererii actualizat la 'oferta trimisa'.");
    } catch (error) {
      setMessage(`Eroare: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="alert alert-info">Se încarcă detaliile comenzii...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!order) {
    return <div className="alert alert-warning">Comanda nu a fost găsită!</div>;
  }

  return (
    <div className="container my-4">
      <h2 className="text-center">
        Generează Ofertă pentru Cerere #{order.orderNumber || orderId}
      </h2>
      {message && (
        <div className={`alert ${message.startsWith("Eroare") ? "alert-danger" : "alert-success"}`}>
          {message}
        </div>
      )}

      {/* Detalii Comandă */}
      <div className="mb-4">
        <p><strong>Client:</strong> {order.firstName} {order.lastName}</p>
        <p><strong>Mașină:</strong> {order.carMake} {order.carModel} ({order.carYear})</p>
        <p><strong>Transmisie:</strong> {order.transmission}</p>
        <p><strong>Motor:</strong> {order.engineSize} cm³ - {order.fuelType}</p>
        <p><strong>VIN:</strong> {order.vin}</p>
        <p><strong>Detalii Piesă:</strong> {order.partDetails}</p>
      </div>

      {/* Ofertele existente */}
      {offer && (
        <div className="alert alert-info">
          <p><strong>Ofertă existentă:</strong></p>
          <p>Total: {offer.total} RON</p>
          <p>Status: {offer.status}</p>
        </div>
      )}

      {/* Adaugă Piese */}
      <button className="btn btn-primary mb-3" onClick={handleAddPart}>Adaugă Piesă</button>

      {parts.map((part, index) => (
        <div key={index} className="row mb-2">
          <div className="col-md-2">
            <input
              type="text"
              placeholder="Nume piesă"
              className="form-control"
              value={part.name}
              onChange={(e) => handlePartChange(index, "name", e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <input
              type="text"
              placeholder="Cod piesă"
              className="form-control"
              value={part.code}
              onChange={(e) => handlePartChange(index, "code", e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <input
              type="number"
              placeholder="Valoare"
              className="form-control"
              value={part.value}
              onChange={(e) => handlePartChange(index, "value", parseFloat(e.target.value))}
            />
          </div>
          <div className="col-md-2">
            <input
              type="number"
              placeholder="Cantitate"
              className="form-control"
              value={part.quantity}
              onChange={(e) => handlePartChange(index, "quantity", parseInt(e.target.value))}
            />
          </div>
          <div className="col-md-2">
            <input
              type="text"
              placeholder="Tip piesă"
              className="form-control"
              value={part.partType || ""}
              onChange={(e) => handlePartChange(index, "partType", e.target.value)}
            />
          </div>
          <div className="col-md-1">
            <button
              className="btn btn-danger"
              onClick={() => setParts(parts.filter((_, i) => i !== index))}
            >
              Șterge
            </button>
          </div>
        </div>
      ))}

      {/* Total și Submit */}
      <h4 className="mt-4">Total: {total} RON</h4>
      <button className="btn btn-success mt-3" onClick={handleSubmitOffer}>Trimite Ofertă</button>
    </div>
  );
};

export default OfferGenerator;
