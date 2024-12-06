import express from "express";
import {
  signup,
  signin,
  signOut,
  refreshToken,
  requestPasswordReset, // Noua rută
  validateSignup,
  validateSignin,
  resetPassword
} from "../controllers/authController.js";

const router = express.Router();

// Rute pentru autentificare
router.post("/signup", validateSignup, signup); // Creare cont nou, cu validare a datelor
router.post("/signin", validateSignin, signin);
router.post("/signout", signOut); // Logout
router.post("/refresh-token", refreshToken); // Refresh token

// Rute pentru resetarea parolei
router.post("/request-password-reset", requestPasswordReset); // Trimitere email resetare parolă
router.post("/reset-password", resetPassword); // Resetare parolă efectivă

export default router;
