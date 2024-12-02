import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const OfferManagement = () => {
  const [offers, setOffers] = useState([]);
  const [orderNumberFilter, setOrderNumberFilter] = useState(""); // Filtru pentru `orderNumber`
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOffers = async () => {
    setLoading(true);
    setError("");
    try {
      const query = orderNumberFilter ? `?orderNumber=${orderNumberFilter}` : "";
      const response = await fetchWithAuth(`http://localhost:5000/api/offer${query}`);
      setOffers(response.data);
    } catch (err) {
      setError(err.message || "Failed to fetch offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [orderNumberFilter]);

  return (
    <div className="container my-4">
      <h2 className="text-center">Management Oferte</h2>

      {/* Filtru după `orderNumber` */}
      <div className="mb-3">
        <label htmlFor="filter" className="form-label">
          Filtrează după Număr Cerere
        </label>
        <input
          type="number"
          id="filter"
          className="form-control"
          value={orderNumberFilter}
          onChange={(e) => setOrderNumberFilter(e.target.value)}
          placeholder="Introduceți numărul cererii"
        />
      </div>

      {/* Feedback */}
      {loading && <div className="alert alert-info">Se încarcă ofertele...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && offers.length === 0 && (
        <div className="alert alert-warning">Nu există oferte disponibile.</div>
      )}

      {/* Afișare Oferte */}
      {!loading && offers.length > 0 && (
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              <th>Număr Oferta</th>
              <th>Client</th>
              <th>Număr Cerere</th>
              <th>Total</th>
              <th>Status</th>
              <th>Data</th>
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer._id}>
                <td>{offer.offerId}</td>
                <td>{offer.orderId?.firstName} {offer.orderId?.lastName}</td>
                <td>{offer.orderNumber}</td>
                <td>{offer.total} RON</td>
                <td>{offer.status}</td>
                <td>{new Date(offer.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-sm btn-primary">Vezi Detalii</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OfferManagement;
