import React, { useEffect, useReducer, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { logout } from "../slices/authSlice";

const initialState = {
  profile: null,
  loading: true,
  error: "",
  activeSection: "", // 'editProfile', 'changePassword', or empty for default view
  updatedData: {},
  passwordData: { currentPassword: "", newPassword: "" },
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_PROFILE":
      return {
        ...state,
        profile: action.payload,
        updatedData: { ...action.payload, companyDetails: action.payload.companyDetails || {} },
        loading: false,
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_ACTIVE_SECTION":
      return { ...state, activeSection: action.payload };
    case "UPDATE_DATA":
      return { ...state, updatedData: { ...state.updatedData, ...action.payload } };
    case "UPDATE_PASSWORD":
      return { ...state, passwordData: { ...state.passwordData, ...action.payload } };
    default:
      return state;
  }
};

const MyProfile = () => {
  const reduxDispatch = useDispatch();
  const { user, authChecked } = useSelector((state) => state.auth);
  const [state, localDispatch] = useReducer(reducer, initialState);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (!authChecked) return;

    if (authChecked && user && !state.profile) {
      fetchProfile();
    }
  }, [authChecked, user, state.profile]);

  const fetchProfile = async () => {
    try {
      const response = await fetchWithAuth("http://localhost:5000/api/user/me");
      console.log("Răspuns profil:", response); // Verifică răspunsul
      if (response && response.user) {
        localDispatch({ type: "SET_PROFILE", payload: response.user }); // Setează doar obiectul `user`
      } else {
        throw new Error("Datele utilizatorului nu au fost găsite.");
      }
    } catch (err) {
      console.error("Eroare la preluarea profilului:", err);
      localDispatch({
        type: "SET_ERROR",
        payload: err.message || "Nu s-au putut prelua informațiile utilizatorului.",
      });
    }
  };


  const handleUpdateProfile = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:5000/api/user/update/${state.profile._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(state.updatedData),
        }
      );
  
      alert("Profil actualizat cu succes!");
      fetchProfile(); // Reîncarcă datele utilizatorului
      localDispatch({ type: "SET_ACTIVE_SECTION", payload: "" });
    } catch (err) {
      alert("Eroare la actualizarea profilului: " + err.message);
    }
  };
  

  const handleChangePassword = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:5000/api/user/update-password/${state.profile._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(state.passwordData),
        }
      );
  
      // Presupunem că `fetchWithAuth` returnează direct JSON-ul
      if (response.error) {
        alert(`Eroare: ${response.message || "A apărut o eroare!"}`);
        return;
      }
  
      alert(response.message || "Parola a fost schimbată cu succes!");
      localDispatch({ type: "SET_ACTIVE_SECTION", payload: "" });
    } catch (err) {
      alert("Eroare la schimbarea parolei: " + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Ești sigur că vrei să ștergi contul?")) return;

    try {
      await fetchWithAuth(`http://localhost:5000/api/user/delete/${state.profile._id}`, {
        method: "DELETE",
      });

      reduxDispatch(logout());
      alert("Contul a fost șters cu succes!");
    } catch (err) {
      alert("Eroare la ștergerea contului: " + err.message);
    }
  };

  if (!authChecked) return <div>Verificăm autentificarea...</div>;

  if (state.loading) return <div className="alert alert-info">Se încarcă datele...</div>;
  if (state.error) return <div className="alert alert-danger">{state.error}</div>;

  return (
    <div className="container my-4">
      <h2 className="text-center mb-4">Profilul Meu</h2>
      <div className="card shadow-lg p-4">
        {state.activeSection === "" && (
          <>
            {state.profile.userType === "persoana_fizica" ? (
              <>
                <p><strong>Prenume:</strong> {state.profile.firstName || "N/A"}</p>
                <p><strong>Nume:</strong> {state.profile.lastName || "N/A"}</p>
              </>
            ) : (
              <>
                <p><strong>Numele companiei:</strong> {state.profile.companyDetails?.companyName || "N/A"}</p>
                <p><strong>CUI:</strong> {state.profile.companyDetails?.cui || "N/A"}</p>
                <p><strong>Nr. Reg. Com.:</strong> {state.profile.companyDetails?.nrRegCom || "N/A"}</p>
              </>
            )}
            <p><strong>Email:</strong> {state.profile.email}</p>
            <p><strong>Telefon:</strong> {state.profile.phone || "N/A"}</p>
            <p><strong>Rol:</strong> {state.profile.role}</p>
            <div className="d-flex flex-column gap-2">
              <button
                className="btn btn-primary"
                onClick={() => localDispatch({ type: "SET_ACTIVE_SECTION", payload: "editProfile" })}
              >
                Editează Profil
              </button>
              <button
                className="btn btn-warning"
                onClick={() => localDispatch({ type: "SET_ACTIVE_SECTION", payload: "changePassword" })}
              >
                Schimbă Parola
              </button>
              <button className="btn btn-danger" onClick={handleDeleteAccount}>
                Șterge Cont
              </button>
            </div>
          </>
        )}

        {state.activeSection === "editProfile" && (
          <>
            <h4>Editează Profil</h4>
            {state.profile.userType === "persoana_fizica" ? (
              <>
                <div className="mb-3">
                  <label htmlFor="firstName" className="form-label">Prenume</label>
                  <input
                    type="text"
                    className="form-control"
                    id="firstName"
                    value={state.updatedData.firstName || ""}
                    onChange={(e) =>
                      localDispatch({ type: "UPDATE_DATA", payload: { firstName: e.target.value } })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="lastName" className="form-label">Nume</label>
                  <input
                    type="text"
                    className="form-control"
                    id="lastName"
                    value={state.updatedData.lastName || ""}
                    onChange={(e) =>
                      localDispatch({ type: "UPDATE_DATA", payload: { lastName: e.target.value } })
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="mb-3">
                  <label htmlFor="companyName" className="form-label">Numele companiei</label>
                  <input
                    type="text"
                    className="form-control"
                    id="companyName"
                    value={state.updatedData.companyDetails?.companyName || ""}
                    onChange={(e) =>
                      localDispatch({
                        type: "UPDATE_DATA",
                        payload: { companyDetails: { ...state.updatedData.companyDetails, companyName: e.target.value } },
                      })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="cui" className="form-label">CUI</label>
                  <input
                    type="text"
                    className="form-control"
                    id="cui"
                    value={state.updatedData.companyDetails?.cui || ""}
                    onChange={(e) =>
                      localDispatch({
                        type: "UPDATE_DATA",
                        payload: { companyDetails: { ...state.updatedData.companyDetails, cui: e.target.value } },
                      })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="nrRegCom" className="form-label">Nr. Reg. Com.</label>
                  <input
                    type="text"
                    className="form-control"
                    id="nrRegCom"
                    value={state.updatedData.companyDetails?.nrRegCom || ""}
                    onChange={(e) =>
                      localDispatch({
                        type: "UPDATE_DATA",
                        payload: { companyDetails: { ...state.updatedData.companyDetails, nrRegCom: e.target.value } },
                      })
                    }
                  />
                </div>
              </>
            )}
            <div className="mb-3">
              <label htmlFor="phone" className="form-label">Telefon</label>
              <input
                type="text"
                className="form-control"
                id="phone"
                value={state.updatedData.phone || ""}
                onChange={(e) =>
                  localDispatch({ type: "UPDATE_DATA", payload: { phone: e.target.value } })
                }
              />
            </div>
            <button className="btn btn-success w-100 mb-2" onClick={handleUpdateProfile}>
              Salvează
            </button>
            <button
              className="btn btn-secondary w-100"
              onClick={() => localDispatch({ type: "SET_ACTIVE_SECTION", payload: "" })}
            >
              Anulează
            </button>
          </>
        )}

        {state.activeSection === "changePassword" && (
          <>
            <h4>Schimbă Parola</h4>
            <div className="mb-3">
              <label htmlFor="currentPassword" className="form-label">Parola Curentă</label>
              <div className="input-group">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className="form-control"
                  id="currentPassword"
                  value={state.passwordData.currentPassword}
                  onChange={(e) =>
                    localDispatch({
                      type: "UPDATE_PASSWORD",
                      payload: { currentPassword: e.target.value },
                    })
                  }
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                >
                  {showCurrentPassword ? "Ascunde" : "Afișează"}
                </button>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">Parola Nouă</label>
              <div className="input-group">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-control"
                  id="newPassword"
                  value={state.passwordData.newPassword}
                  onChange={(e) =>
                    localDispatch({
                      type: "UPDATE_PASSWORD",
                      payload: { newPassword: e.target.value },
                    })
                  }
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? "Ascunde" : "Afișează"}
                </button>
              </div>
            </div>
            <button className="btn btn-success w-100 mb-2" onClick={handleChangePassword}>
              Salvează
            </button>
            <button
              className="btn btn-secondary w-100"
              onClick={() => localDispatch({ type: "SET_ACTIVE_SECTION", payload: "" })}
            >
              Anulează
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
