import express from "express";
import {
  createNotification,
  getAllNotifications,
  getUserNotifications,
  markAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController.js";
import { verifyToken } from "../utils/verifyToken.js";

const router = express.Router();

// Rute pentru notificări
router.post("/", verifyToken, createNotification); // Creare notificare
router.get("/", verifyToken, getAllNotifications); // Toate notificările
router.get("/me", verifyToken, getUserNotifications); // Notificările utilizatorului logat
router.patch("/:notificationId/read", verifyToken, markAsRead); // Marcare ca citită
router.delete("/:notificationId", verifyToken, deleteNotification); // Ștergere notificare
router.delete("/", verifyToken, deleteAllNotifications); // Ștergere toate notificările

export default router;
