import React, { useState } from "react";
import Logo from "../assets/all-images/Logo.webp";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../slices/authSlice";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Verifică dacă parolele coincid
    if (password !== confirmPassword) {
      setError("Parolele nu se potrivesc!");
      return;
    }

    try {
      // 1. Cerere pentru înregistrare
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Înregistrare eșuată");
      }

      // 2. Autentificare automată
      const loginResponse = await fetch("http://localhost:5000/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.message || "Autologin eșuat");
      }

      const userData = await loginResponse.json();

      // 3. Actualizează starea autentificării în Redux
      dispatch(login({ email: userData.email, name: userData.username }));

      // 4. Navighează utilizatorul la pagina principală
      navigate("/home");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="text-center mb-4">
            <img src={Logo} alt="Your Company" className="img-fluid mb-3" style={{ maxHeight: "160px" }} />
            <h2 className="fw-bold">Creează un cont nou</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm bg-white">
            {error && <div className="alert alert-danger text-center">{error}</div>}
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
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Parola
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="confirm-password" className="form-label">
                Confirmă parola
              </label>
              <input
                type="password"
                className="form-control"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Creează cont
            </button>
          </form>
          <p className="mt-3 text-center">
            Ai deja un cont?{" "}
            <a href="/signin" className="text-decoration-none text-primary">
              Conectează-te aici
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
