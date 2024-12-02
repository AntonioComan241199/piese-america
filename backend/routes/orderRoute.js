import express from "express";
import {
  createOrder,
  getAllOrders,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  addCommentToOrder,
  deleteOrder,
  exportOrders,
} from "../controllers/orderController.js";
import { verifyToken, checkRole } from "../utils/verifyToken.js";

const router = express.Router();

// Rute pentru administratori
router.get("/admin", verifyToken, checkRole("admin"), getAllOrders); // Obține toate cererile
router.patch("/admin/:id/status", verifyToken, checkRole("admin"), updateOrderStatus); // Actualizare status
router.delete("/admin/:id", verifyToken, checkRole("admin"), deleteOrder); // Ștergere cerere
router.get("/admin/export", verifyToken, checkRole("admin"), exportOrders); // Export cereri

// Rute pentru utilizatori autentificați
router.post("/", verifyToken, createOrder); // Creare cerere
router.get("/client/orders", verifyToken, getUserOrders); // Obține cererile proprii
router.get("/client/orders/:id", verifyToken, getOrderById); // Detalii cerere
router.post("/client/orders/:id/comments", verifyToken, addCommentToOrder); // Adăugare comentariu

export default router;
