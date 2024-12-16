import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { login } from "../slices/authSlice";
import Logo from "../assets/all-images/Logo.webp";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    userType: "persoana_fizica",
    firstName: "",
    lastName: "",
    phone: "",
    companyDetails: {
      companyName: "",
      cui: "",
      nrRegCom: "",
    },
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Funcție pentru gestionarea schimbărilor în input-uri
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("companyDetails.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        companyDetails: { ...prev.companyDetails, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { password, confirmPassword, userType, firstName, lastName, companyDetails } = formData;

    if (password.length < 6) {
      setError("Parola trebuie să aibă cel puțin 6 caractere.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Parolele nu se potrivesc.");
      return;
    }

    if (userType === "persoana_juridica") {
      const { companyName, cui, nrRegCom } = companyDetails;
      if (!companyName || !cui || !nrRegCom) {
        setError("Pentru persoanele juridice, toate câmpurile companiei sunt obligatorii.");
        return;
      }
    } else if (userType === "persoana_fizica" && (!firstName || !lastName)) {
      setError("Pentru persoanele fizice, prenumele și numele sunt obligatorii.");
      return;
    }

    setLoading(true);
    try {
      // Înregistrare utilizator
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Înregistrare eșuată.");
      }

      // Login automat după înregistrare
      const loginResponse = await fetch("http://localhost:5000/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.message || "Autentificare automată eșuată.");
      }

      const userData = await loginResponse.json();

      // Salvare token-uri în localStorage
      localStorage.setItem("accessToken", userData.accessToken);
      localStorage.setItem("refreshToken", userData.refreshToken);

      // Actualizare stare utilizator în Redux
      dispatch(
        login({
          user: {
            id: userData.user.id,
            email: userData.user.email,
            role: userData.user.role,
            userType: userData.user.userType,
          },
          accessToken: userData.accessToken,
          refreshToken: userData.refreshToken,
        })
      );

      // Navigare către pagina principală
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="text-center mb-4">
            <img src={Logo} alt="Logo" className="img-fluid mb-3" style={{ maxHeight: "160px" }} />
            <h2 className="fw-bold">Înregistrare</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm bg-white">
            {error && <div className="alert alert-danger text-center">{error}</div>}

            {/* Email */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Adresa de email
              </label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Parolă */}
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Parola
              </label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Confirmare parolă */}
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmă parola
              </label>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {/* Tip utilizator */}
            <div className="mb-3">
              <label htmlFor="userType" className="form-label">
                Tip utilizator
              </label>
              <select
                name="userType"
                className="form-select"
                value={formData.userType}
                onChange={handleChange}
                required
              >
                <option value="persoana_fizica">Persoană Fizică</option>
                <option value="persoana_juridica">Persoană Juridică</option>
              </select>
            </div>

            {/* Detalii utilizator */}
            {formData.userType === "persoana_fizica" && (
              <>
                <div className="mb-3">
                  <label htmlFor="firstName" className="form-label">
                    Prenume
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    className="form-control"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="lastName" className="form-label">
                    Nume
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    className="form-control"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            {formData.userType === "persoana_juridica" && (
              <>
                <div className="mb-3">
                  <label htmlFor="companyName" className="form-label">
                    Numele firmei
                  </label>
                  <input
                    type="text"
                    name="companyDetails.companyName"
                    className="form-control"
                    value={formData.companyDetails.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="cui" className="form-label">
                    CUI
                  </label>
                  <input
                    type="text"
                    name="companyDetails.cui"
                    className="form-control"
                    value={formData.companyDetails.cui}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="nrRegCom" className="form-label">
                    Număr Registrul Comerțului
                  </label>
                  <input
                    type="text"
                    name="companyDetails.nrRegCom"
                    className="form-control"
                    value={formData.companyDetails.nrRegCom}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            {/* Telefon */}
            <div className="mb-3">
              <label htmlFor="phone" className="form-label">
                Telefon
              </label>
              <input
                type="text"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <Form.Group controlId="termsAndConditions">
            <Form.Check
              type="checkbox"
              label={
                <>
                  Sunt de acord cu{" "}
                  <Link to="/terms" className="text-primary">
                    Termenii și Condițiile
                  </Link>
                </>
              }
              required
            />
          </Form.Group>

            <button type="submit" className="btn btn-primary w-100 mt-2" disabled={loading}>
              {loading ? "Se înregistrează..." : "Înregistrează-te"}
            </button>
          </form>
          <p className="mt-3 text-center">
            Ai deja un cont?{" "}
            <Link to="/signin" className="text-decoration-none text-primary">
              Conectează-te aici
            </Link>
          </p>
          
        </div>
      </div>
    </div>
  );
}
