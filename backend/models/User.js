import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ['client', 'admin'], default: 'client' },
});


const User = mongoose.model('User', UserSchema);

export default User;