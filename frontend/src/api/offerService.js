import axios from "./axiosInstance"; // Instanță preconfigurată cu token JWT

export const fetchAllOffers = async (params) => {
  const { data } = await axios.get("/offers/admin", { params });
  return data;
};

export const fetchUserOffers = async (params) => {
  const { data } = await axios.get("/offers/client", { params });
  return data;
};

export const fetchOfferDetails = async (offerId) => {
  const { data } = await axios.get(`/offers/${offerId}`);
  return data;
};

export const updateOfferStatus = async (offerId, status) => {
  const { data } = await axios.patch(`/offers/admin/${offerId}`, { status });
  return data;
};

export const exportOffers = async (format) => {
  const response = await axios.get(`/offers/admin/export`, {
    params: { format },
    responseType: "blob", // Pentru descărcarea fișierelor
  });
  return response.data;
};

export const finalizeOffer = async (offerId, payload) => {
  const { data } = await axios.patch(`/offers/${offerId}/finalize`, payload);
  return data;
};
