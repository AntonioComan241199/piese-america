import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ValidationError, NotFoundError, ConflictError, UnauthorizedError } from "../utils/errors.js";

export class AuthService {
  /**
   * Generează access token
   */
  static generateAccessToken(user) {
    return jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        userType: user.userType 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || "24h" }
    );
  }

  /**
   * Generează refresh token
   */
  static generateRefreshToken(user) {
    return jwt.sign(
      { id: user._id }, 
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || "30d" }
    );
  }

  /**
   * Generează token pentru resetare parolă
   */
  static generatePasswordResetToken(user) {
    return jwt.sign(
      { id: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_RESET_EXPIRY || "1h" }
    );
  }

  /**
   * Verifică disponibilitatea email-ului
   */
  static async isEmailAvailable(email) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    return !existingUser;
  }

  /**
   * Creează un utilizator nou
   */
  static async createUser(userData) {
    const {
      email,
      password,
      phone,
      firstName,
      lastName,
      userType,
      companyDetails
    } = userData;

    // Verifică dacă email-ul este disponibil
    if (!(await this.isEmailAvailable(email))) {
      throw new ConflictError("Acest email este deja utilizat.");
    }

    // Creează utilizatorul
    const newUser = new User({
      email: email.toLowerCase().trim(),
      password, // Va fi hash-uit automat de schema
      phone: phone?.trim(),
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      userType,
      companyDetails: userType === "persoana_juridica" ? companyDetails : {},
    });

    return await newUser.save();
  }

  /**
   * Autentifică un utilizator
   */
  static async authenticateUser(email, password) {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      throw new NotFoundError("Utilizatorul nu a fost găsit.");
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new UnauthorizedError("Credențiale invalide.");
    }

    return user;
  }

  /**
   * Generează și salvează tokens pentru utilizator
   */
  static async generateTokensForUser(user) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Salvează refresh token în DB
    user.refreshToken = refreshToken;
    user.updatedAt = new Date();
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName,
        companyDetails: user.companyDetails
      }
    };
  }

  /**
   * Reîmprospătează access token-ul
   */
  static async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new UnauthorizedError("No refresh token provided.");
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedError("Invalid refresh token.");
      }

      // Generează tokens noi
      return await this.generateTokensForUser(user);
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new UnauthorizedError("Invalid or expired refresh token.");
      }
      throw error;
    }
  }

  /**
   * Deconectează utilizatorul (invalidează refresh token)
   */
  static async signOutUser(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      throw new NotFoundError("Utilizatorul nu a fost găsit.");
    }

    // Invalidează refresh token
    user.refreshToken = null;
    user.updatedAt = new Date();
    await user.save();

    return true;
  }

  /**
   * Inițiază procesul de resetare a parolei
   */
  static async initiatePasswordReset(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Nu dezvăluim că utilizatorul nu există pentru securitate
      return { success: true, message: "Un email a fost trimis pentru resetarea parolei." };
    }

    const token = this.generatePasswordResetToken(user);
    
    return {
      success: true,
      token,
      user,
      message: "Un email a fost trimis pentru resetarea parolei."
    };
  }

  /**
   * Resetează parola utilizatorului
   */
  static async resetUserPassword(token, newPassword) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verifică că token-ul este pentru resetare parolă
      if (decoded.purpose !== 'password_reset') {
        throw new UnauthorizedError("Token invalid pentru resetarea parolei.");
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        throw new NotFoundError("Utilizatorul nu a fost găsit.");
      }

      // Actualizează parola (va fi hash-uită automat de schema)
      user.password = newPassword;
      user.refreshToken = null; // Invalidează toate sesiunile
      user.updatedAt = new Date();
      await user.save();

      return true;
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new UnauthorizedError("Token invalid sau expirat.");
      }
      throw error;
    }
  }

  /**
   * Verifică și returnează informații despre utilizator din token
   */
  static async getUserFromToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      
      if (!user) {
        throw new NotFoundError("Utilizatorul nu a fost găsit.");
      }

      return user;
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new UnauthorizedError("Token invalid sau expirat.");
      }
      throw error;
    }
  }

  /**
   * Invalidează toate sesiunile unui utilizator
   */
  static async revokeAllSessions(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("Utilizatorul nu a fost găsit.");
    }

    user.refreshToken = null;
    user.updatedAt = new Date();
    await user.save();

    return true;
  }

  /**
   * Actualizează ultima activitate a utilizatorului
   */
  static async updateUserActivity(userId) {
    await User.findByIdAndUpdate(userId, { 
      updatedAt: new Date() 
    });
  }

  /**
   * Obține profilul complet al utilizatorului
   */
  static async getUserProfile(userId) {
    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) {
      throw new NotFoundError("Utilizatorul nu a fost găsit.");
    }
    return user;
  }

  /**
   * Schimbă parola utilizatorului (cu verificare parolă curentă)
   */
  static async changeUserPassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("Utilizatorul nu a fost găsit.");
    }

    const isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordCorrect) {
      throw new UnauthorizedError("Parola curentă este incorectă.");
    }

    user.password = newPassword; // Va fi hash-uită automat
    user.refreshToken = null; // Invalidează toate sesiunile pentru securitate
    user.updatedAt = new Date();
    await user.save();

    return true;
  }
}