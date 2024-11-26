import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/UserRoute.js';
import authRouter from './routes/authRoute.js';
import orderRoute from './routes/orderRoute.js';
import carRoutes from "./routes/carRoutes.js"; 
import cookieParser from 'cookie-parser';
import cors from "cors";

dotenv.config();

const app = express();

// Middleware-uri globale
app.use(express.json());
app.use(cookieParser());

// Middleware pentru CORS
app.use(
    cors({
      origin: "http://localhost:5173", // URL-ul frontend-ului (în timpul dezvoltării)
      credentials: true, // Permite trimiterea cookie-urilor sau header-ului Authorization
    })
  );

// Conectare la MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.log("MongoDB connection error:", err);
});

app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/order', orderRoute);
app.use("/api/cars", carRoutes); // Prefixăm rutele cu /api/cars


// Middleware pentru erori
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({ success: false, statusCode, message });
});

// Pornire server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});