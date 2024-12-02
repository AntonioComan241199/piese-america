import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const OfferDetail = () => {
  const { offerId } = useParams();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedParts, setSelectedParts] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchOffer = async () => {
      setLoading(true);
      try {
        const response = await fetchWithAuth(`http://localhost:5000/api/offer/${offerId}`);
        setOffer(response.data);
        setSelectedParts(response.data.selectedParts || {});
      } catch (err) {
        setError("Nu s-a putut încărca oferta.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [offerId]);

  const handlePartSelect = (partType, selectedPart) => {
    setSelectedParts({ ...selectedParts, [partType]: selectedPart });
  };

  const handleSubmitSelection = async () => {
    try {
      await fetchWithAuth(`http://localhost:5000/api/offer/${offerId}/selected-parts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedParts }),
      });
      setMessage("Selecțiile au fost salvate cu succes.");
    } catch (err) {
      setMessage("Eroare la salvarea selecțiilor.");
    }
  };

  if (loading) return <div className="alert alert-info">Se încarcă oferta...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container my-4">
      <h2 className="text-center">Oferta #{offer.offerId}</h2>
      {message && <div className="alert alert-success">{message}</div>}
      <h4>Total: {offer.total} RON</h4>

      {offer.parts.map((group) => (
        <div key={group.partType} className="mb-4">
          <h5>{group.partType}</h5>
          <div className="row">
            {group.alternatives.map((part) => (
              <div key={part.code} className="col-md-4">
                <div
                  className={`card ${selectedParts[group.partType]?.code === part.code ? "border-success" : ""}`}
                  onClick={() => handlePartSelect(group.partType, part)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-body">
                    <h6>{part.name}</h6>
                    <p>Cod: {part.code}</p>
                    <p>Producător: {part.producer}</p>
                    <p>Preț: {part.value} RON</p>
                    <p>Stoc: {part.stock}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button className="btn btn-primary mt-3" onClick={handleSubmitSelection}>
        Salvează selecțiile
      </button>
    </div>
  );
};

export default OfferDetail;
