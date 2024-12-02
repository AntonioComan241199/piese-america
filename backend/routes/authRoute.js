import express from "express";
import {
  signup,
  signin,
  signOut,
  refreshToken,
  validateSignup,
  validateSignin,
} from "../controllers/authController.js";

const router = express.Router();

// Rute pentru autentificare
router.post("/signup", validateSignup, signup); // Creare cont nou, cu validare a datelor
router.post("/signin", validateSignin, signin);
router.post("/signout", signOut); // Logout
router.post("/refresh-token", refreshToken); // Refresh token

export default router;
