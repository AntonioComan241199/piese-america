import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization'); // Extragem tokenul din header

    if (!token) {
        return res.status(401).json({ message: 'Acces neautorizat. Tokenul lipsește.' });
    }

    try {
        // Verificăm tokenul folosind secretul definit în `.env`
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Adăugăm informațiile utilizatorului în obiectul `req`
        next(); // Continuăm către următorul middleware sau handler
    } catch (error) {
        res.status(401).json({ message: 'Token invalid.' });
    }
};

export default authMiddleware;
