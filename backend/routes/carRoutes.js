import express from "express";
import { getYears, getMakes, getModels } from "../controllers/carController.js";

const router = express.Router();

// Rute pentru obținerea datelor din baza de date
router.get("/years", getYears);       // Obține anii disponibili
router.get("/makes", getMakes);       // Obține mărcile în funcție de an
router.get("/models", getModels);     // Obține modelele în funcție de an și marcă

export default router;
