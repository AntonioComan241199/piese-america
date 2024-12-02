import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

// Funcții auxiliare pentru generarea token-urilor
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// Înregistrare utilizator
export const signup = async (req, res, next) => {
  const {
    email,
    password,
    phone,
    firstName,
    lastName,
    userType,
    companyDetails,
  } = req.body;

  try {
    // Validare input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verifică dacă email-ul este deja utilizat
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        code: "USER_EXISTS",
        message: "Acest email este deja utilizat.",
      });
    }

    // Validări specifice pentru persoana juridică
    if (userType === "persoana_juridica") {
      if (
        !companyDetails ||
        !companyDetails.companyName ||
        !companyDetails.cui ||
        !companyDetails.nrRegCom
      ) {
        return res.status(400).json({
          code: "INVALID_COMPANY_DETAILS",
          message:
            "Pentru persoanele juridice, trebuie să completați toate detaliile firmei (nume, CUI, număr înregistrare).",
        });
      }
    }

    // Validări specifice pentru persoana fizică
    if (userType === "persoana_fizica" && (!firstName || !lastName)) {
      return res.status(400).json({
        code: "INVALID_PERSONAL_DETAILS",
        message: "Pentru persoanele fizice, prenumele și numele sunt obligatorii.",
      });
    }

    // Creăm utilizatorul
    const newUser = new User({
      email,
      password, // Parola brută va fi hash-uită automat în schema utilizatorului
      phone,
      firstName,
      lastName,
      userType,
      companyDetails: userType === "persoana_juridica" ? companyDetails : {},
    });

    // Salvăm utilizatorul în baza de date
    await newUser.save();

    res.status(201).json({ message: "Utilizator creat cu succes!" });
  } catch (error) {
    next(error);
  }
};

// Autentificare utilizator
export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Validare input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ code: "USER_NOT_FOUND", message: "Utilizatorul nu a fost găsit." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Credențiale invalide." });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        userType: user.userType,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token
export const refreshToken = async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ code: "NO_REFRESH_TOKEN", message: "No refresh token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ code: "INVALID_REFRESH_TOKEN", message: "Invalid refresh token." });
    }

    const newAccessToken = generateAccessToken(user);

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ code: "EXPIRED_REFRESH_TOKEN", message: "Invalid or expired refresh token." });
  }
};

// Deconectare utilizator
export const signOut = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.status(200).json({ message: "Deconectare reușită." });
  } catch (error) {
    next(error);
  }
};

// Middleware pentru validarea datelor din cereri
export const validateSignup = [
  body("email").isEmail().withMessage("Adresa de email este invalidă."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Parola trebuie să aibă cel puțin 6 caractere."),
  body("userType")
    .isIn(["persoana_fizica", "persoana_juridica"])
    .withMessage("Tipul de utilizator este invalid."),
];

// Validare pentru autentificare
export const validateSignin = [
  body("email").isEmail().withMessage("Adresa de email este invalidă."),
  body("password").notEmpty().withMessage("Parola este obligatorie."),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];