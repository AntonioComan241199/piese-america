import express from "express";
import upload from "../middleware/multerConfig.js";
import { getAllFireExtinguishers, addFireExtinguisher, updateFireExtinguisher, deleteFireExtinguisher, uploadImage } from "../controllers/fireExtinguishersController.js";

const router = express.Router();

router.get("/", getAllFireExtinguishers);
router.post("/", upload.single("image"), addFireExtinguisher);
router.put("/:id", updateFireExtinguisher);
router.delete("/:id", deleteFireExtinguisher);

// Rută separată pentru upload imagini
router.post("/upload", upload.single("image"), uploadImage);

export default router;