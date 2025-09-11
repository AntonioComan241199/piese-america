import express from "express";
import {
  signup,
  signin,
  signOut,
  refreshToken,
  requestPasswordReset,
  resetPassword
} from "../controllers/authController.js";
import {
  validateSignup,
  validateSignin,
  validatePasswordResetRequest,
  validatePasswordReset
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Rute pentru autentificare
router.post("/signup", validateSignup, signup); // Creare cont nou, cu validare a datelor
router.post("/signin", validateSignin, signin);
router.post("/signout", signOut); // Logout
router.post("/refresh-token", refreshToken); // Refresh token

// Rute pentru resetarea parolei
router.post("/request-password-reset", validatePasswordResetRequest, requestPasswordReset); // Trimitere email resetare parolă
router.post("/reset-password", validatePasswordReset, resetPassword); // Resetare parolă efectivă

export default router;
