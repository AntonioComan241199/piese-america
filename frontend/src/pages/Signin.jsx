import React, { useState } from "react";
import Logo from "../assets/all-images/Logo.webp";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../slices/authSlice";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Previne reîncărcarea paginii
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Include cookie-uri pentru sesiune
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Autentificare eșuată");
      }

      const data = await response.json();

      // Salvează token-ul în localStorage
      localStorage.setItem("token", data.token);

      // Actualizează starea autentificării în Redux
      dispatch(
        login({
          email: data.email,
          name: data.username,
          role: data.role,
          token: data.token,
        })
      );

      // Navighează utilizatorul la pagina principală după autentificare
      navigate("/home", { replace: true }); // Forțează re-ruta
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="text-center mb-5">
            <img
              src={Logo}
              alt="Your Company"
              className="img-fluid mb-3"
              style={{ maxHeight: "160px" }}
            />
            <h2 className="fw-bold">Conectează-te la contul tău</h2>
          </div>
          <form
            onSubmit={handleSubmit}
            className="p-4 border rounded shadow-sm bg-white"
          >
            {error && (
              <div className="alert alert-danger text-center">{error}</div>
            )}
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
            <button type="submit" className="btn btn-primary w-100">
              Conectează-te
            </button>
          </form>
          <p className="mt-3 text-center">
            Nu ai un cont?{" "}
            <a href="/register" className="text-decoration-none text-primary">
              Creează unul aici
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
