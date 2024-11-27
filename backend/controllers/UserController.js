import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import { errorHandler } from '../utils/error.js';
import Listing from '../models/Order.js';



export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, 'You can only update your own account!'));

  try {
    const user = await User.findById(req.params.id);

    if (!user) return next(errorHandler(404, 'User not found!'));

    // Actualizează doar câmpurile permise
    if (req.body.username) user.username = req.body.username;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.firstName) user.firstName = req.body.firstName;
    if (req.body.lastName) user.lastName = req.body.lastName;

    const updatedUser = await user.save();

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, 'You can only change your own password!'));

  try {
    const user = await User.findById(req.params.id);

    if (!user) return next(errorHandler(404, 'User not found!'));

    // Verifică dacă parola curentă este corectă
    const isPasswordCorrect = bcryptjs.compareSync(
      req.body.currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return next(errorHandler(401, 'Parola curentă este incorectă!'));
    }

    // Hash-uiește și setează parola nouă
    user.password = bcryptjs.hashSync(req.body.newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Parola a fost schimbată cu succes!' });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, 'You can only delete your own account!'));
  try {
    await User.findByIdAndDelete(req.params.id);
    res.clearCookie('access_token');
    res.status(200).json('User has been deleted!');
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (req, res, next) => {
  if (req.user.id === req.params.id) {
    try {
      const listings = await Listing.find({ userRef: req.params.id });
      res.status(200).json(listings);
    } catch (error) {
      next(error);
    }
  } else {
    return next(errorHandler(401, 'You can only view your own orders!'));
  }
};

export const getAuthenticatedUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};