import { AuthService } from "../services/authService.js";
import { AuthEmailService } from "../services/authEmailService.js";
import { AuthValidator } from "../validators/authValidator.js";
import { UnauthorizedError } from "../utils/errors.js";

let authEmailService = null;

function getAuthEmailService() {
  if (!authEmailService) {
    authEmailService = new AuthEmailService();
  }
  return authEmailService;
}

/**
 * Înregistrare utilizator nou
 */
export const signup = async (req, res, next) => {
  try {
    // Datele sunt deja sanitizate și validate de middleware
    const user = await AuthService.createUser(req.body);

    // Trimite email de bun venit (non-blocking)
    getAuthEmailService().sendWelcomeEmail(
      user.email, 
      user.firstName || user.companyDetails?.companyName, 
      user.userType
    ).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    res.status(201).json({ 
      success: true,
      message: "Utilizator creat cu succes!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Autentificare utilizator
 */
export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Datele sunt deja validate de middleware
    const user = await AuthService.authenticateUser(email, password);

    // Generare tokens
    const authData = await AuthService.generateTokensForUser(user);

    // Actualizare activitate utilizator
    AuthService.updateUserActivity(user._id).catch(console.error);

    res.status(200).json({
      success: true,
      message: "Autentificare reușită.",
      ...authData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reîmprospătează access token-ul
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    // Validare token
    AuthValidator.validateRefreshToken(token);

    // Reîmprospătează token-ul
    const authData = await AuthService.refreshAccessToken(token);

    res.status(200).json({
      success: true,
      message: "Token reîmprospătat cu succes.",
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deconectare utilizator
 */
export const signOut = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email-ul este obligatoriu pentru deconectare."
      });
    }

    await AuthService.signOutUser(email);

    res.status(200).json({ 
      success: true,
      message: "Deconectare reușită." 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cerere pentru resetarea parolei
 */
export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Validare email
    AuthValidator.validatePasswordResetEmail(email);

    // Inițiează procesul de resetare
    const result = await AuthService.initiatePasswordReset(email);

    // Dacă utilizatorul există, trimite email
    if (result.token && result.user) {
      await getAuthEmailService().sendPasswordResetEmail(
        email,
        result.token,
        result.user.firstName || result.user.companyDetails?.companyName
      );
    }

    // Răspuns identic indiferent dacă utilizatorul există sau nu (pentru securitate)
    res.status(200).json({ 
      success: true,
      message: result.message 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resetarea parolei
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    // Validare date
    AuthValidator.validatePasswordReset({ token, newPassword });

    // Resetează parola
    await AuthService.resetUserPassword(token, newPassword);

    res.status(200).json({ 
      success: true,
      message: "Parola a fost resetată cu succes!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Schimbare parolă (pentru utilizatori autentificați)
 */
export const changePassword = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Autentificare necesară.");
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validare date
    AuthValidator.validatePasswordChange({ 
      currentPassword, 
      newPassword, 
      confirmPassword 
    });

    // Schimbă parola
    await AuthService.changeUserPassword(req.user.id, currentPassword, newPassword);

    // Trimite email de confirmare (non-blocking)
    const user = await AuthService.getUserProfile(req.user.id);
    getAuthEmailService().sendPasswordChangedEmail(
      user.email,
      user.firstName || user.companyDetails?.companyName
    ).catch(error => {
      console.error('Failed to send password changed email:', error);
    });

    res.status(200).json({ 
      success: true,
      message: "Parola a fost schimbată cu succes. Toate sesiunile active au fost deconectate." 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obține profilul utilizatorului curent
 */
export const getProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Autentificare necesară.");
    }

    const userProfile = await AuthService.getUserProfile(req.user.id);

    res.status(200).json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifică validitatea token-ului
 */
export const verifyToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new UnauthorizedError("Token-ul este obligatoriu.");
    }

    const user = await AuthService.getUserFromToken(token);

    res.status(200).json({
      success: true,
      message: "Token valid.",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        userType: user.userType
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Invalidează toate sesiunile utilizatorului
 */
export const revokeAllSessions = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Autentificare necesară.");
    }

    await AuthService.revokeAllSessions(req.user.id);

    // Trimite alertă de securitate (non-blocking)
    const user = await AuthService.getUserProfile(req.user.id);
    getAuthEmailService().sendSecurityAlert(
      user.email,
      user.firstName || user.companyDetails?.companyName,
      "Toate sesiunile au fost deconectate",
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    ).catch(error => {
      console.error('Failed to send security alert:', error);
    });

    res.status(200).json({
      success: true,
      message: "Toate sesiunile au fost invalidate cu succes."
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Testează configurația email-ului (doar pentru admini)
 */
export const testEmailConfig = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new UnauthorizedError("Acces interzis. Doar administratorii pot testa configurația email-ului.");
    }

    const result = await getAuthEmailService().testEmailConnection();

    res.status(200).json({
      success: result.success,
      message: result.message,
      ...(result.error && { error: result.error })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifică disponibilitatea unui email
 */
export const checkEmailAvailability = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email-ul este obligatoriu."
      });
    }

    AuthValidator.validatePasswordResetEmail(email);

    const isAvailable = await AuthService.isEmailAvailable(email);

    res.status(200).json({
      success: true,
      available: isAvailable,
      message: isAvailable ? "Email disponibil." : "Email-ul este deja folosit."
    });
  } catch (error) {
    next(error);
  }
};

