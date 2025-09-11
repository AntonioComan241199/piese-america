import { AuthValidator } from "../validators/authValidator.js";
import { ValidationError } from "../utils/errors.js";

/**
 * Middleware pentru validarea datelor de înregistrare
 */
export const validateSignup = (req, res, next) => {
  try {
    // Sanitizează datele
    const sanitizedData = AuthValidator.sanitizeSignupData(req.body);
    
    // Validează datele
    AuthValidator.validateSignupData(sanitizedData);
    
    // Setează datele sanitizate în request
    req.body = sanitizedData;
    
    next();
  } catch (error) {
    next(new ValidationError(error.message));
  }
};

/**
 * Middleware pentru validarea datelor de autentificare
 */
export const validateSignin = (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validează datele
    AuthValidator.validateSigninData({ email, password });
    
    next();
  } catch (error) {
    next(new ValidationError(error.message));
  }
};

/**
 * Middleware pentru validarea cererii de resetare parolă
 */
export const validatePasswordResetRequest = (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new Error('Email este obligatoriu');
    }
    
    if (!AuthValidator.isValidEmail(email)) {
      throw new Error('Email invalid');
    }
    
    next();
  } catch (error) {
    next(new ValidationError(error.message));
  }
};

/**
 * Middleware pentru validarea resetării parolei
 */
export const validatePasswordReset = (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    if (!token) {
      throw new Error('Token este obligatoriu');
    }
    
    if (!password) {
      throw new Error('Parola este obligatorie');
    }
    
    // Validează puterea parolei
    const passwordValidation = AuthValidator.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }
    
    next();
  } catch (error) {
    next(new ValidationError(error.message));
  }
};