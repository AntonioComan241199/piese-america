import Notification from "../models/Notification.js";
import { errorHandler } from "../utils/error.js";

// Creare notificare
export const createNotification = async (req, res, next) => {
  const { userId, type, message } = req.body;

  try {
    if (!type || !message) {
      return next(errorHandler(400, "Tipul și mesajul notificării sunt obligatorii."));
    }

    const notification = new Notification({
      userId: userId || null, // Dacă userId nu este furnizat, setăm null (pentru notificări generale)
      type,
      message,
    });

    const savedNotification = await notification.save();
    res.status(201).json({ success: true, message: "Notificarea a fost creată cu succes.", notification: savedNotification });
  } catch (error) {
    next(error);
  }
};

// Obținerea tuturor notificărilor
export const getAllNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .populate("userId", "email firstName lastName") // Populare userId cu detalii utilizator
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// Obținerea notificărilor pentru utilizatorul logat
export const getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// Marcarea unei notificări ca citită
export const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return next(errorHandler(404, "Notificarea nu a fost găsită."));
    }

    res.status(200).json({ success: true, message: "Notificarea a fost marcată ca citită.", notification });
  } catch (error) {
    next(error);
  }
};

// Ștergerea unei notificări
export const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return next(errorHandler(404, "Notificarea nu a fost găsită."));
    }

    res.status(200).json({ success: true, message: "Notificarea a fost ștearsă cu succes." });
  } catch (error) {
    next(error);
  }
};

// Ștergerea tuturor notificărilor
export const deleteAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({});
    res.status(200).json({ success: true, message: "Toate notificările au fost șterse cu succes." });
  } catch (error) {
    next(error);
  }
};
