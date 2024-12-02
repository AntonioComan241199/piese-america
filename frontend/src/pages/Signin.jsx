import React, { useState } from "react";
import Logo from "../assets/all-images/Logo.webp";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../slices/authSlice";

export default function Signin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Autentificare eșuată.");
      }

      const data = await response.json();

      // Salvare token-uri în localStorage
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      // Actualizare stare utilizator în Redux
      dispatch(
        login({
          user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            userType: data.user.userType,
          },
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
      );

      // Navigare către pagina principală sau rol specific
      if (data.user.role === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? "Autentificare..." : "Conectează-te"}
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
