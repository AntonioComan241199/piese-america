import React, { useState, useEffect, useRef } from "react";
import Logo from "../../assets/all-images/home-images/Logo.webp";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../slices/authSlice";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;


const Signin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

   // Creează referința pentru câmpul de email
   const emailInputRef = useRef(null);

   // Setează focus pe câmpul de email la montare
   useEffect(() => {
     emailInputRef.current.focus();
   }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
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

      console.log("API URL:", import.meta.env.VITE_API_URL);


      const data = await response.json();

      // Salvare token-uri în localStorage
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      // Actualizarea stării autentificării în Redux
      dispatch(login({
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
        },
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }));

      // Verifică dacă există un URL salvat în localStorage
      const redirectTo = localStorage.getItem('redirectTo') || '/home'; // Folosește /home ca fallback
      console.log("Redirecting to:", redirectTo); // Verificare debug

      // **Curăță URL-ul salvat** după ce redirecționezi utilizatorul
      localStorage.removeItem('redirectTo'); // Asigură-te că ștergi redirectTo după redirecționare

      // Redirecționează utilizatorul
      setLoading(false); // Asigură-te că redirecționarea se face după setarea stării
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
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
              alt="PIESE AUTO AMERICA"
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
                ref={emailInputRef}
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
          {/* Butonul pentru resetarea parolei */}
          <p className="text-center">
            <a href="/reset-password" className="text-decoration-none text-primary">
              Ai uitat parola?
            </a>
          </p>
          <p className="mt-3 text-center">
            Prin conectare, confirm că sunt de acord cu{" "}
            <Link to="/terms" className="text-primary">
              Termenii și Condițiile
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signin;

