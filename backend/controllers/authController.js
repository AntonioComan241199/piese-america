import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { errorHandler } from '../utils/error.js';
import jwt from "jsonwebtoken";

export const signup = async (req, res, next) => {
    const { email, password } = req.body;
  
    try {
      // Verifică dacă utilizatorul există deja
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Acest email este deja utilizat." });
      }
  
      // Creează utilizatorul
      const hashedPassword = bcrypt.hashSync(password, 10);
      const newUser = new User({ email, password: hashedPassword });
  
      await newUser.save();
      res.status(201).json({ message: "Utilizator creat cu succes!" });
    } catch (error) {
      next(error);
    }
  };

  export const signin = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isPasswordCorrect = bcrypt.compareSync(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Trimite atât token-ul, cât și datele utilizatorului
        res.status(200).json({
            token,
            email: user.email,
            username: user.firstName + " " + user.lastName,
            role: user.role,
        });
    } catch (error) {
        next(error);
    }
};
  

export const google= async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            const { password: pass, ...rest } = user._doc;
            res.cookie('access_token', token, { httpOnly: true }).status(200).json(rest);
        } else {
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hasedPassword = bcrypt.hashSync(generatedPassword, 10);
            const newUser = new User({ username: req.body.name.split(" ").join("").toLowerCase() + Math.random().toString(36).slice(-4), email: req.body.email, password: hasedPassword, avatar: req.body.photo });
            await newUser.save();
            const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
            const { password: pass, ...rest } = newUser._doc;
            res.cookie('access_token', token, { httpOnly: true }).status(200).json(rest);
        }
    } catch (error) {
        next(error);
    }
}

export const signOut = async (req, res, next) => {
    try {
      res.clearCookie('access_token');
      res.status(200).json('User has been logged out!');
    } catch (error) {
      next(error);
    }
  };