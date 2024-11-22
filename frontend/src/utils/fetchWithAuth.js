export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token"); // Preluăm token-ul din localStorage
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }), // Adăugăm header-ul Authorization dacă există token
    };
  
    const response = await fetch(url, { ...options, headers });
  
    if (!response.ok) {
      // Aruncă eroarea pentru a fi gestionată în componenta apelantă
      const error = await response.json();
      throw new Error(error.message || "Something went wrong");
    }
  
    return response.json(); // Returnează datele JSON
  };
  