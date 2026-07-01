// frontend/src/api/stockProductService.js
import axiosInstance from "./axiosInstance";

const BASE = "/stock-products";

const uploadConfig = {
  timeout: 60000, // 60 secunde pentru create/update cu imagine
};

// 1. Obține toate produsele
export const getAllStockProducts = async (filters = {}) => {
  const res = await axiosInstance.get(BASE, { params: filters });
  return res.data;
};

// 2. Obține un produs după ID
export const getStockProductById = async (id) => {
  const res = await axiosInstance.get(`${BASE}/${id}`);
  return res.data;
};

// 3. Creează un produs nou (ADMIN)
export const createStockProduct = async (formData) => {
  const res = await axiosInstance.post(BASE, formData, uploadConfig);
  return res.data;
};

// 4. Actualizează un produs (ADMIN)
export const updateStockProduct = async (id, formData) => {
  const res = await axiosInstance.put(`${BASE}/${id}`, formData, uploadConfig);
  return res.data;
};

// 5. Șterge un produs (ADMIN)
export const deleteStockProduct = async (id) => {
  const res = await axiosInstance.delete(`${BASE}/${id}`);
  return res.data;
};

// Exportăm totul ca default object pentru import simplu
export default {
  getAll: getAllStockProducts,
  getById: getStockProductById,
  create: createStockProduct,
  update: updateStockProduct,
  remove: deleteStockProduct,
};