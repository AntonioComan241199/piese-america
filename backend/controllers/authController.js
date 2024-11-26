import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET, // Trebuie să fie diferit de JWT_SECRET
    { expiresIn: "7d" }
  );
};

export const signup = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Acest email este deja utilizat." });
    }

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
    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Credențiale invalide." });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();
    
    res.status(200).json({
      accessToken,
      refreshToken,
      email: user.email,
      username: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user);

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const token = generateAccessToken(user);
      res.status(200).json({ token, user });
    } else {
      const hashedPassword = bcrypt.hashSync(Math.random().toString(36).slice(-8), 10);
      const newUser = new User({
        email: req.body.email,
        password: hashedPassword,
        firstName: req.body.name,
      });
      await newUser.save();

      const token = generateAccessToken(newUser);
      res.status(201).json({ token, user: newUser });
    }
  } catch (error) {
    next(error);
  }
};

export const signOut = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.status(200).json({ message: "User logged out successfully!" });
  } catch (error) {
    next(error);
  }
};
