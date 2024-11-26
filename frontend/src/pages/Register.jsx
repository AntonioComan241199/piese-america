import React, { useState } from "react";
import Logo from "../assets/all-images/Logo.webp";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../slices/authSlice";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redirecționează utilizatorul autentificat
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Parola trebuie să aibă cel puțin 8 caractere!");
      return;
    }
    if (password !== confirmPassword) {
      setError("Parolele nu se potrivesc!");
      return;
    }

    setLoading(true);

    try {
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
      dispatch(
        login({
          email: userData.email,
          name: userData.username,
          token: userData.accessToken,
          refreshToken: userData.refreshToken,
        })
      );

      navigate("/home");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
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
                className={`form-control ${
                  password && confirmPassword && password !== confirmPassword ? "is-invalid" : ""
                }`}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {password && confirmPassword && password !== confirmPassword && (
                <div className="invalid-feedback">Parolele nu se potrivesc!</div>
              )}
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Se creează contul..." : "Creează cont"}
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
