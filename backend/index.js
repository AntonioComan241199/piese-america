import express from "express";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import fs from 'fs';

// Importăm rutele
import userRouter from "./routes/UserRoute.js";
import authRouter from "./routes/authRoute.js";
import orderRoute from "./routes/orderRoute.js";
import carRoutes from "./routes/carRoutes.js";
import offerRoute from "./routes/offerRoute.js";
import notificationRoute from "./routes/notificationRoute.js";
import contactRoute from "./routes/contactRoute.js";
import oilProductsRoutes from "./routes/oilProductsRoutes.js";
import fireExtinguishersRoutes from "./routes/fireExtinguishersRoutes.js";

// Configurare variabile de mediu
dotenv.config();

// Inițializare aplicație Express
const app = express();

// Middleware-uri globale
app.use(express.json()); // Pentru parsarea datelor JSON
app.use(cookieParser()); // Pentru parsarea cookie-urilor

// Middleware pentru CORS
const allowedOrigins = [
  "http://localhost:5173",  // Vite dev server
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // Permite trimiterea cookie-urilor sau a header-ului Authorization
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Permite doar metodele necesare
    allowedHeaders: ["Content-Type", "Authorization", "Accept"], // Am adăugat
  })
);

// Conectare la MongoDB
mongoose.connect(process.env.MONGODB_URI, {}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.log("MongoDB connection error:", err);
});

// Expunem folderul "uploads" ca resursă statică
const __dirname = path.resolve(); // Pentru compatibilitate cu ES Module
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Definirea rutelor API
app.use("/api/user", userRouter); // Rute pentru utilizatori
app.use("/api/auth", authRouter); // Rute pentru autentificare
app.use("/api/orders", orderRoute); // Rute pentru cereri de ofertă
app.use("/api/cars", carRoutes); // Rute pentru date despre mașini
app.use("/api/offer", offerRoute); // Rute pentru oferte
app.use("/api/notifications", notificationRoute);
app.use("/api/contact", contactRoute); // Rute pentru formularul de contact
app.use("/api/oil-products", oilProductsRoutes);
app.use("/api/fire-extinguishers", fireExtinguishersRoutes);



// Middleware pentru gestionarea erorilor
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[Error] ${message}`); // Logare eroare
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// Pornire server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
