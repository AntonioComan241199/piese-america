import express from "express";
import {
  changePassword,
  deleteUser,
  updateUser,
  getAuthenticatedUser,
  getBillingAddress,
  saveBillingAddress,
} from "../controllers/UserController.js";
import { verifyToken } from "../utils/verifyToken.js";
import { body } from "express-validator";

const router = express.Router();

// Validare pentru actualizarea profilului
const validateUpdateUser = [
  body("email").optional().isEmail().withMessage("Adresa de email este invalidă."),
  body("phone").optional().isMobilePhone().withMessage("Numărul de telefon este invalid."),
  body("firstName").optional().isLength({ min: 2 }).withMessage("Prenumele trebuie să aibă cel puțin 2 caractere."),
  body("lastName").optional().isLength({ min: 2 }).withMessage("Numele trebuie să aibă cel puțin 2 caractere."),
];

// Rute
router.put("/update-password/:id", verifyToken, changePassword);
router.put("/update/:id", verifyToken, validateUpdateUser, updateUser);
router.delete("/delete/:id", verifyToken, deleteUser);
router.get("/me", verifyToken, getAuthenticatedUser);

// Obține adresa de facturare
router.get("/billing-address", verifyToken, getBillingAddress);

// Salvează adresa de facturare
router.post("/billing-address", verifyToken, saveBillingAddress);

export default router;
