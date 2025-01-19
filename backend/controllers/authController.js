import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import nodemailer from "nodemailer";

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
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    // Invalidează token-ul din baza de date
    user.refreshToken = null;
    await user.save();

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

// Funcție pentru trimiterea email-ului de resetare a parolei folosind configurația corectă SMTP
const sendResetPasswordEmail = async (email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "mail.pieseautoamerica.ro", // Serverul SMTP
      port: 587, // Portul SMTP pentru SSL
      secure: true, // Folosește SSL
      auth: {
        user: "no-reply@pieseautoamerica.ro", // Adresa de email utilizată pentru trimitere
        pass: "Automed14!@", // Parola asociată
      },
    });

    const resetLink = `http://pieseautoamerica.ro/reset-password/${token}`; // Modifică URL-ul cu domeniul tău

    const mailOptions = {
      from: "no-reply@pieseautoamerica.ro", // Adresa expeditorului
      to: email, // Adresa destinatarului
      subject: "Piese Auto America - Resetare Parolă",
      text: `Ai solicitat resetarea parolei pentru contul tău. Accesează link-ul pentru a-ți reseta parola: ${resetLink}`,
      html: `
        <h1>Resetare Parolă</h1>
        <p>Ai primit acest email deoarece ai solicitat resetarea parolei pentru contul tău.</p>
        <p>Dacă nu ai solicitat resetarea parolei, te rugăm să ignori acest email.</p>
        <p>Click <a href="${resetLink}">aici</a> pentru a-ți reseta parola.</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email trimis cu succes:", info.messageId);
  } catch (error) {
    console.error("Eroare la trimiterea email-ului de resetare a parolei:", error.message);
    throw new Error("Eroare la trimiterea email-ului de resetare a parolei.");
  }
};


// Cerere pentru resetarea parolei
export const requestPasswordReset = async (req, res, next) => {
  const { email } = req.body;

  try {
    // Verificăm dacă utilizatorul există
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    // Generăm token-ul de resetare a parolei
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Trimiterea email-ului de resetare a parolei folosind SMTP
    await sendResetPasswordEmail(email, token);

    res.status(200).json({ message: "Un email a fost trimis pentru resetarea parolei." });
  } catch (error) {
    next(error);
  }
};

// Resetarea parolei
export const resetPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    // Verificăm token-ul
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Găsește utilizatorul asociat token-ului
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    // Actualizăm parola utilizatorului
    user.password = newPassword
    await user.save();

    res.status(200).json({ message: "Parola a fost resetată cu succes!" });
  } catch (error) {
    next(error);
  }
};
