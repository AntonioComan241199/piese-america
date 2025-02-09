import express from "express";
import upload from "../middleware/multerConfig.js"; // Importăm configurarea multer
import { getAllOilProducts, addOilProduct, updateOilProduct, deleteOilProduct, uploadImage } from "../controllers/oilProductsController.js";

const router = express.Router();

router.get("/", getAllOilProducts);
router.post("/", upload.single("image"), addOilProduct); // Aplicăm middleware-ul pentru upload
router.put("/:id", updateOilProduct);
router.delete("/:id", deleteOilProduct);

// 🔹 **Rută pentru încărcare imagini separat**
router.post("/upload", upload.single("image"), uploadImage);

export default router;
