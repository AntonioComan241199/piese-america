import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const initialFormData = {
  userType: "persoana_fizica", // Default: persoana fizică
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  companyDetails: {
    companyName: "",
    cui: "",
    nrRegCom: "",
  },
  carYear: "",
  carMake: "",
  carModel: "",
  fuelType: "",
  enginePower: "",
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

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchYears();
    if (isAuthenticated) {
      prepopulateUserData();
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

  const prepopulateUserData = () => {
    if (user) {
      setFormData((prevData) => ({
        ...prevData,
        userType: user.userType || "persoana_fizica",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phone || "",
        companyDetails: user.companyDetails || {
          companyName: "",
          cui: "",
          nrRegCom: "",
        },
      }));
      setUserPrepopulated(true);
    }
  };

  const fetchYears = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/cars/years");
      if (response.ok) {
        const data = await response.json();
        // Extragem direct din obiect
        setYears(Array.isArray(data.years) ? data.years : []);
      } else {
        console.error("Failed to fetch years:", response.status);
        setYears([]); // Resetare pentru siguranță
      }
    } catch (error) {
      console.error("Error fetching years:", error);
      setYears([]); // Resetare în caz de eroare
    }
  };
  

  const fetchMakes = async (year) => {
    try {
      const response = await fetch(`http://localhost:5000/api/cars/makes?year=${year}`);
      if (response.ok) {
        const data = await response.json();
        // Extragem direct din obiect
        setMakes(Array.isArray(data.makes) ? data.makes : []);
      } else {
        console.error(`Failed to fetch makes for year ${year}:`, response.status);
        setMakes([]); // Resetare pentru siguranță
      }
    } catch (error) {
      console.error(`Error fetching makes for year ${year}:`, error);
      setMakes([]); // Resetare în caz de eroare
    }
  };

  const fetchModels = async (year, make) => {
    try {
      const response = await fetch(`http://localhost:5000/api/cars/models?year=${year}&make=${make}`);
      if (response.ok) {
        const data = await response.json();
        // Extragem direct din obiect
        setModels(Array.isArray(data.models) ? data.models : []);
      } else {
        console.error(`Failed to fetch models for year ${year} and make ${make}:`, response.status);
        setModels([]); // Resetare pentru siguranță
      }
    } catch (error) {
      console.error(`Error fetching models for year ${year} and make ${make}:`, error);
      setModels([]); // Resetare în caz de eroare
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const headers = {
        "Content-Type": "application/json",
      };
      const token = localStorage.getItem("accessToken");
      if (isAuthenticated && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Request failed");
      }

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
        {/* User Type */}
        <div className="mb-3">
          <label htmlFor="userType" className="form-label">Tip utilizator</label>
          <select
            id="userType"
            className="form-select"
            value={formData.userType}
            onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
          >
            <option value="persoana_fizica">Persoană Fizică</option>
            <option value="persoana_juridica">Persoană Juridică</option>
          </select>
        </div>

        {/* Persoana Fizică */}
        {formData.userType === "persoana_fizica" && (
          <>
            <div className="mb-3">
              <label htmlFor="firstName" className="form-label">Prenume</label>
              <input
                type="text"
                id="firstName"
                className="form-control"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="lastName" className="form-label">Nume</label>
              <input
                type="text"
                id="lastName"
                className="form-control"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </>
        )}

        {/* Persoana Juridică */}
        {formData.userType === "persoana_juridica" && (
          <>
            <div className="mb-3">
              <label htmlFor="companyName" className="form-label">Numele firmei</label>
              <input
                type="text"
                id="companyName"
                className="form-control"
                value={formData.companyDetails.companyName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    companyDetails: { ...formData.companyDetails, companyName: e.target.value },
                  })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="cui" className="form-label">CUI</label>
              <input
                type="text"
                id="cui"
                className="form-control"
                value={formData.companyDetails.cui}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    companyDetails: { ...formData.companyDetails, cui: e.target.value },
                  })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="nrRegCom" className="form-label">Nr. Registrul Comerțului</label>
              <input
                type="text"
                id="nrRegCom"
                className="form-control"
                value={formData.companyDetails.nrRegCom}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    companyDetails: { ...formData.companyDetails, nrRegCom: e.target.value },
                  })
                }
                required
              />
            </div>
          </>
        )}

        {/* Email */}
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={isAuthenticated}
            required
          />
        </div>

        {/* Telefon */}
        <div className="mb-3">
          <label htmlFor="phoneNumber" className="form-label">Telefon</label>
          <input
            type="text"
            id="phoneNumber"
            className="form-control"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            required
          />
        </div>

        {/* Dropdown-uri dinamice pentru mașină */}
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
            {Array.isArray(years) && years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Marca */}
        <div className="mb-3">
          <label htmlFor="carMake" className="form-label">Marca</label>
          <select
            id="carMake"
            className="form-select"
            value={formData.carMake}
            onChange={(e) => setFormData({ ...formData, carMake: e.target.value, carModel: "" })}
            disabled={!formData.carYear}
            required
          >
            <option value="" disabled>Selectează marca</option>
            {makes.map((make) => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div className="mb-3">
          <label htmlFor="carModel" className="form-label">Model</label>
          <select
            id="carModel"
            className="form-select"
            value={formData.carModel}
            onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
            disabled={!formData.carMake}
            required
          >
            <option value="" disabled>Selectează modelul</option>
            {models.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>

        {/* Restul detaliilor vehiculului */}
        <div className="mb-3">
          <label htmlFor="fuelType" className="form-label">Tip combustibil</label>
          <select
            id="fuelType"
            className="form-select"
            value={formData.fuelType}
            onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
            required
          >
            <option value="" disabled>Selectează combustibilul</option>
            <option value="benzina">Benzină</option>
            <option value="motorina">Motorină</option>
            <option value="electric">Electric</option>
            <option value="hibrid">Hibrid</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="engineSize" className="form-label">Capacitate cilindrică motor (cm³)</label>
          <input
            type="number"
            id="engineSize"
            className="form-control"
            value={formData.engineSize}
            onChange={(e) => setFormData({ ...formData, engineSize: e.target.value })}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="enginePower" className="form-label">Putere motor (CP)</label>
          <input
            type="number"
            id="enginePower"
            className="form-control"
            value={formData.enginePower}
            onChange={(e) => setFormData({ ...formData, enginePower: e.target.value })}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="transmission" className="form-label">Cutie de viteze</label>
          <select
            id="transmission"
            className="form-select"
            value={formData.transmission}
            onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
            required
          >
            <option value="" disabled>Selectează cutia de viteze</option>
            <option value="manuala">Manuală</option>
            <option value="automata">Automată</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="vin" className="form-label">VIN (Număr identificare vehicul)</label>
          <input
            type="text"
            id="vin"
            className="form-control"
            value={formData.vin}
            onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="partDetails" className="form-label">Detalii piesă dorită</label>
          <textarea
            id="partDetails"
            className="form-control"
            value={formData.partDetails}
            onChange={(e) => setFormData({ ...formData, partDetails: e.target.value })}
            rows="4"
            required
          ></textarea>
        </div>

        <div className="text-center">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Se trimite..." : "Trimite cererea"}
          </button>
        </div>

        {message && <p className="text-center fw-bold text-success">{message}</p>}
      </form>
    </div>
  );
};

export default RequestOrder;
