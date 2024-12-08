import express from "express";
import { sendContactEmail } from "../controllers/contactController.js"; // Importăm funcția
import { verifyToken } from "../utils/verifyToken.js"; // Dacă ai nevoie de autentificare, importă verifyToken

const router = express.Router();

// Ruta pentru trimiterea mesajului de contact
router.post("/", sendContactEmail); // POST pentru trimiterea mesajului

export default router;
