import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, index: true }, // Email unic cu index pentru căutări rapide
    password: { type: String, required: true },
    phone: { type: String, required: false },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    role: { type: String, enum: ['client', 'admin'], default: 'client' },
    refreshToken: { type: String, required: false }, // Suport pentru Refresh Token
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Middleware pentru actualizarea câmpului `updatedAt` la fiecare salvare
UserSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Modelul User
const User = mongoose.model('User', UserSchema);

export default User;
