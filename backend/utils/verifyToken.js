import jwt from "jsonwebtoken";

// verifyToken.js
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Atașăm datele utilizatorului
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};


// checkRole.js
export const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ message: `Access denied: ${requiredRole}s only` });
    }
    next();
  };
};
