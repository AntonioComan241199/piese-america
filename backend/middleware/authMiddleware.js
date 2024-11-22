import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Extrage token-ul din header
    if (!token) {
        return res.status(401).json({ message: "Access denied, no token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decodează token-ul
        req.user = decoded; // Atașează datele utilizatorului în req.user
        console.log("Decoded token in authMiddleware:", req.user); // Debugging
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};

export default authMiddleware;
