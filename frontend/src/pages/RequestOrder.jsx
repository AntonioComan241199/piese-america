import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";


const initialFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  carYear: "",
  carMake: "",
  carModel: "",
  fuelType: "",
  engineSize: "",
  transmission: "",
  vin: "",
  partDetails: "",
};

const RequestOrder = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [years, setYears] = useState([]);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userPrepopulated, setUserPrepopulated] = useState(false);

  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchYears();
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (formData.carYear) {
      fetchMakes(formData.carYear);
    } else {
      setMakes([]);
      setModels([]);
    }
  }, [formData.carYear]);

  useEffect(() => {
    if (formData.carYear && formData.carMake) {
      fetchModels(formData.carYear, formData.carMake);
    } else {
      setModels([]);
    }
  }, [formData.carMake]);

  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:5000/api/user/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prevData) => ({
          ...prevData,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phoneNumber: data.phone || "",
        }));
        setUserPrepopulated(true);
      } else {
        console.error("Error fetching user data:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const fetchYears = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/cars/years");
      if (response.ok) {
        const data = await response.json();
        setYears(data);
      } else {
        console.error("Failed to fetch years.");
      }
    } catch (error) {
      console.error("Error fetching years:", error);
    }
  };

  const fetchMakes = async (year) => {
    try {
      const response = await fetch(`http://localhost:5000/api/cars/makes?year=${year}`);
      if (response.ok) {
        const data = await response.json();
        setMakes(data);
      } else {
        console.error("Failed to fetch makes.");
      }
    } catch (error) {
      console.error("Error fetching makes:", error);
    }
  };

  const fetchModels = async (year, make) => {
    try {
      const response = await fetch(`http://localhost:5000/api/cars/models?year=${year}&make=${make}`);
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      } else {
        console.error("Failed to fetch models.");
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
  
    try {
      // Construiește antetele cererii
      const headers = {
        "Content-Type": "application/json",
      };
  
      // Adaugă token doar dacă utilizatorul este autentificat
      const token = localStorage.getItem("token");
      if (isAuthenticated && token) {
        headers.Authorization = `Bearer ${token}`;
      }
  
      // Trimiterea cererii către backend
      const response = await fetch("http://localhost:5000/api/order/create", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Request failed");
      }
  
      // Resetarea formularului și afișarea mesajului de succes
      setMessage("Cererea a fost trimisă cu succes!");
      setFormData(initialFormData);
      setMakes([]);
      setModels([]);
    } catch (error) {
      setMessage(`Eroare: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Formular Cerere Piese Auto</h2>
      {isAuthenticated && userPrepopulated && (
        <div className="alert alert-info text-center">
          Câmpurile au fost precompletate cu informațiile tale.
        </div>
      )}
      <form onSubmit={handleSubmit} className="shadow p-4 rounded bg-light">
        {/* Prenume */}
        <div className="mb-3">
          <label htmlFor="firstName" className="form-label">
            Prenume
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            className="form-control"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            required
          />
        </div>

        {/* Nume */}
        <div className="mb-3">
          <label htmlFor="lastName" className="form-label">
            Nume
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            className="form-control"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            required
          />
        </div>

        {/* Email */}
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required={!isAuthenticated} // Email este obligatoriu doar dacă utilizatorul nu este autentificat
            disabled={isAuthenticated} // Email-ul este completabil doar dacă utilizatorul nu este autentificat
          />
        </div>

        {/* Telefon */}
        <div className="mb-3">
          <label htmlFor="phoneNumber" className="form-label">
            Telefon
          </label>
          <input
            type="text"
            id="phoneNumber"
            name="phoneNumber"
            className="form-control"
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value })
            }
            required
          />
        </div>

        {/* Dropdown-uri dinamice */}
        {/* An fabricație */}
        <div className="mb-3">
          <label htmlFor="carYear" className="form-label">
            An fabricație
          </label>
          <select
            id="carYear"
            name="carYear"
            className="form-select"
            value={formData.carYear}
            onChange={(e) =>
              setFormData({ ...formData, carYear: e.target.value, carMake: "", carModel: "" })
            }
            required
          >
            <option value="" disabled>
              Selectează anul
            </option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Marca */}
        <div className="mb-3">
          <label htmlFor="carMake" className="form-label">
            Marca
          </label>
          <select
            id="carMake"
            name="carMake"
            className="form-select"
            value={formData.carMake}
            onChange={(e) =>
              setFormData({ ...formData, carMake: e.target.value, carModel: "" })
            }
            disabled={!formData.carYear}
            required
          >
            <option value="" disabled>
              Selectează marca
            </option>
            {makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div className="mb-3">
          <label htmlFor="carModel" className="form-label">
            Model
          </label>
          <select
            id="carModel"
            name="carModel"
            className="form-select"
            value={formData.carModel}
            onChange={(e) =>
              setFormData({ ...formData, carModel: e.target.value })
            }
            disabled={!formData.carMake}
            required
          >
            <option value="" disabled>
              Selectează modelul
            </option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {/* Combustibil */}
        <div className="mb-3">
          <label htmlFor="fuelType" className="form-label">
            Tip combustibil
          </label>
          <select
            id="fuelType"
            name="fuelType"
            className="form-select"
            value={formData.fuelType}
            onChange={(e) =>
              setFormData({ ...formData, fuelType: e.target.value })
            }
            required
          >
            <option value="" disabled>
              Selectează combustibilul
            </option>
            <option value="benzina">Benzină</option>
            <option value="motorina">Motorină</option>
            <option value="electric">Electric</option>
            <option value="hibrid">Hibrid</option>
          </select>
        </div>

        {/* Capacitate cilindrică */}
        <div className="mb-3">
          <label htmlFor="engineSize" className="form-label">
            Capacitate cilindrică motor (cm³)
          </label>
          <input
            type="number"
            id="engineSize"
            name="engineSize"
            className="form-control"
            value={formData.engineSize}
            onChange={(e) =>
              setFormData({ ...formData, engineSize: e.target.value })
            }
            required
          />
        </div>

        {/* Cutie de viteze */}
        <div className="mb-3">
          <label htmlFor="transmission" className="form-label">
            Cutie de viteze
          </label>
          <select
            id="transmission"
            name="transmission"
            className="form-select"
            value={formData.transmission}
            onChange={(e) =>
              setFormData({ ...formData, transmission: e.target.value })
            }
            required
          >
            <option value="" disabled>
              Selectează tipul cutiei de viteze
            </option>
            <option value="manuala">Manuală</option>
            <option value="automata">Automată</option>
          </select>
        </div>

        {/* VIN */}
        <div className="mb-3">
          <label htmlFor="vin" className="form-label">
            VIN (Număr identificare vehicul)
          </label>
          <input
            type="text"
            id="vin"
            name="vin"
            className="form-control"
            value={formData.vin}
            onChange={(e) =>
              setFormData({ ...formData, vin: e.target.value })
            }
            required
          />
        </div>

        {/* Detalii piesă */}
        <div className="mb-3">
          <label htmlFor="partDetails" className="form-label">
            Detalii piesă dorită
          </label>
          <textarea
            id="partDetails"
            name="partDetails"
            className="form-control"
            value={formData.partDetails}
            onChange={(e) =>
              setFormData({ ...formData, partDetails: e.target.value })
            }
            rows="4"
            required
          ></textarea>
        </div>

        {/* Submit */}
        <div className="text-center">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Se trimite..." : "Trimite cererea"}
          </button>
        </div>

        {/* Mesaj */}
        {message && <p className="text-center fw-bold text-success">{message}</p>}
      </form>
    </div>
  );
};

export default RequestOrder;
