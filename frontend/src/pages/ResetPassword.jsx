import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Form, Alert, Spinner } from "react-bootstrap";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useParams(); // Obținem token-ul din URL
  const navigate = useNavigate();

  useEffect(() => {
    // Verifică dacă token-ul este valid
    if (!token) {
      setError("Token-ul de resetare a parolei este invalid.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Verificăm dacă parolele sunt identice
    if (newPassword !== confirmPassword) {
      setError("Parolele nu coincid.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Eroare la resetarea parolei.");
      }

      setSuccess("Parola a fost resetată cu succes.");
      setLoading(false);

      // Navigăm către login după succes
      setTimeout(() => navigate("/signin"), 5000); // După 5 secunde, redirecționăm utilizatorul spre login
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
              <label htmlFor="newPassword" className="form-label">
                Noua Parolă
              </label>
              <input
                type="password"
                className="form-control"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmați Parola
              </label>
              <input
                type="password"
                className="form-control"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : "Resetează Parola"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
