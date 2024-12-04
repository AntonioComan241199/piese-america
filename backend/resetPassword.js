import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./models/User.js"; // Asigură-te că calea către modelul `User` este corectă

// Detalii de conectare la baza de date
const DB_URI = "mongodb+srv://antonioc:Alexandra99.@uscarparts.yhfa8.mongodb.net/?retryWrites=true&w=majority&appName=USCarParts" // Modifică cu URI-ul tău

const resetPassword = async (userId, newPassword) => {
  try {
    await mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conectat la baza de date.");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await User.findByIdAndUpdate(userId, { password: hashedPassword });
    if (!user) {
      console.log("Utilizatorul nu a fost găsit.");
      return;
    }

    console.log("Parola a fost resetată cu succes pentru utilizatorul:", user.email);
    await mongoose.disconnect();
  } catch (error) {
    console.error("Eroare:", error);
    await mongoose.disconnect();
  }
};

// Modifică aici cu ID-ul utilizatorului și noua parolă
resetPassword("674cce5f32fb273781ffa1bb", "password123");
