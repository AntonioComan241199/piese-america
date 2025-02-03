import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Alert, Spinner } from "react-bootstrap";
const API_URL = import.meta.env.VITE_API_URL;


const ResetPasswordRequest = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/request-password-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Eroare la trimiterea email-ului.");
      }

      setSuccess("Un email a fost trimis pentru resetarea parolei.");
      setLoading(false);
      setTimeout(() => navigate("/login"), 5000); // Navigăm spre login după câteva secunde
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4">
          <h2 className="fw-bold text-center mb-4">Resetează Parola</h2>
          <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm bg-white">
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Adresa de email
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : "Trimite Emailul de Resetare"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordRequest;
