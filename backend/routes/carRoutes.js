import express from "express";
import { getYears, getMakes, getModels } from "../controllers/carController.js";

const router = express.Router();

// Rute pentru obținerea datelor din MongoDB
router.get("/years", getYears);       // Endpoint pentru obținerea anilor
router.get("/makes", getMakes);       // Endpoint pentru obținerea mărcilor
router.get("/models", getModels);     // Endpoint pentru obținerea modelelor

export default router;
