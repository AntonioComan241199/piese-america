import jwt from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError } from "./errors.js";
import { AuthService } from "../services/authService.js";

/**
 * Middleware pentru verificarea token-ului JWT
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token de autorizare lipsă.");
    }

    const token = authHeader.split(" ")[1];

    if (!token || token.length < 10) {
      throw new UnauthorizedError("Token invalid.");
    }

    try {
      // Verifică token-ul JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verifică dacă utilizatorul există și este activ (opțional - pentru securitate extra)
      if (process.env.VERIFY_USER_ON_REQUEST === 'true') {
        const user = await AuthService.getUserProfile(decoded.id);
        if (!user) {
          throw new UnauthorizedError("Utilizatorul nu mai există.");
        }
        
        // Actualizează informațiile user-ului cu cele din DB
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role,
          userType: user.userType,
          firstName: user.firstName,
          lastName: user.lastName
        };
      } else {
        // Folosește doar datele din token (mai rapid)
        req.user = decoded;
      }

      // Actualizează activitatea utilizatorului (non-blocking)
      if (process.env.TRACK_USER_ACTIVITY === 'true') {
        AuthService.updateUserActivity(decoded.id).catch(error => {
          console.error('Failed to update user activity:', error);
        });
      }

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new UnauthorizedError("Token-ul a expirat.");
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw new UnauthorizedError("Token invalid.");
      } else if (jwtError.name === 'NotBeforeError') {
        throw new UnauthorizedError("Token-ul nu este încă valabil.");
      }
      throw jwtError;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware pentru verificarea rolului utilizatorului
 */
export const checkRole = (requiredRole) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Autentificare necesară.");
      }

      if (!req.user.role) {
        throw new ForbiddenError("Rol de utilizator nedefinit.");
      }

      if (req.user.role !== requiredRole) {
        throw new ForbiddenError(`Acces interzis. Doar ${requiredRole === 'admin' ? 'administratorii' : 'utilizatorii cu rol ' + requiredRole} pot accesa această resursă.`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware pentru verificarea mai multor roluri
 */
export const checkRoles = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Autentificare necesară.");
      }

      if (!req.user.role) {
        throw new ForbiddenError("Rol de utilizator nedefinit.");
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError(`Acces interzis. Rolurile permise sunt: ${allowedRoles.join(', ')}.`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware pentru verificarea proprietății resursei
 */
export const checkResourceOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Autentificare necesară.");
      }

      // Administratorii pot accesa orice resursă
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      if (!resourceUserId) {
        throw new ForbiddenError("Nu se poate determina proprietarul resursei.");
      }

      if (resourceUserId !== req.user.id) {
        throw new ForbiddenError("Nu aveți permisiunea de a accesa această resursă.");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware opțional pentru token-uri
 */
export const optionalToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Nu există token, dar continuă fără eroare
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (jwtError) {
      // Token invalid, dar nu oprește execuția
      req.user = null;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware pentru verificarea tipului de utilizator
 */
export const checkUserType = (allowedUserTypes) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Autentificare necesară.");
      }

      if (!req.user.userType) {
        throw new ForbiddenError("Tipul de utilizator nu este definit.");
      }

      const userTypesArray = Array.isArray(allowedUserTypes) ? allowedUserTypes : [allowedUserTypes];

      if (!userTypesArray.includes(req.user.userType)) {
        throw new ForbiddenError(`Acces interzis. Tipurile de utilizator permise sunt: ${userTypesArray.join(', ')}.`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware combinat pentru verificarea token-ului și rolului
 */
export const requireAuth = (options = {}) => {
  const { 
    roles = null, 
    userTypes = null, 
    requireOwnership = false,
    ownershipField = 'userId'
  } = options;

  return async (req, res, next) => {
    try {
      // Verifică token-ul
      await verifyToken(req, res, () => {});

      // Verifică rolul dacă este specificat
      if (roles) {
        const roleMiddleware = Array.isArray(roles) ? checkRoles(roles) : checkRole(roles);
        await roleMiddleware(req, res, () => {});
      }

      // Verifică tipul de utilizator dacă este specificat
      if (userTypes) {
        await checkUserType(userTypes)(req, res, () => {});
      }

      // Verifică proprietatea dacă este necesară
      if (requireOwnership) {
        await checkResourceOwnership(ownershipField)(req, res, () => {});
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};