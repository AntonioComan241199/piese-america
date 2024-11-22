import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Extrage token-ul din header
    if (!token) {
        console.log("No token provided");
        return res.status(401).json({ message: "Access denied, no token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decodează token-ul
        req.user = decoded; // Atașează utilizatorul în req.user
        console.log("Decoded token:", decoded); // Debugging
        next();
    } catch (error) {
        console.error("Token verification failed:", error.message);
        res.status(401).json({ message: "Invalid token" });
    }
};

export default authMiddleware;
