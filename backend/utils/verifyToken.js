import jwt from "jsonwebtoken";

// verifyToken.js
// Middleware `verifyToken`
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Autorizare lipsă." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token invalid:", error);
    return res.status(401).json({ message: "Token invalid." });
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