import User from "../models/User.js";
import Order from "../models/Order.js";
import bcrypt from "bcrypt";



// Actualizare profil utilizator
export const updateUser = async (req, res, next) => {
  const { id } = req.params;

  // Verificare permisiuni: utilizatorul își poate actualiza propriul cont sau trebuie să fie admin
  if (req.user.id !== id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Nu aveți acces la această resursă." });
  }

  try {
    const updatedData = req.body;

    // Dacă se actualizează parola, o hash-uim
    if (updatedData.password) {
      updatedData.password = bcrypt.hashSync(updatedData.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true, runValidators: true }
    ).select("-password"); // Exclude parola din răspuns

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    res.status(200).json({ message: "Profilul utilizatorului a fost actualizat cu succes.", user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// Schimbare parolă
export const changePassword = async (req, res, next) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  // Permite schimbarea parolei doar pentru utilizatorul autentificat
  if (req.user.id !== id) {
    return res.status(403).json({ message: "Nu aveți acces la această resursă." });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    // Verifică dacă parola curentă este corectă
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Parola curentă este incorectă." });
    }

    // Hash-uim și setăm parola nouă
    user.password = newPassword
    await user.save();

    res.status(200).json({ message: "Parola a fost schimbată cu succes!" });
  } catch (error) {
    next(error);
  }
};

// Ștergere utilizator
export const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  // Permite ștergerea utilizatorului doar de către el însuși sau un admin
  if (req.user.id !== id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Nu aveți acces la această resursă." });
  }

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    res.status(200).json({ message: "Utilizatorul a fost șters cu succes!" });
  } catch (error) {
    next(error);
  }
};

// Obține toate comenzile unui utilizator
export const getUserOrders = async (req, res, next) => {
  const { id } = req.params;

  // Permite vizualizarea comenzilor doar pentru utilizatorul propriu sau pentru admin
  if (req.user.id !== id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Nu aveți acces la această resursă." });
  }

  try {
    const orders = await Order.find({ userId: id }).populate("offerId", "offerNumber total status");

    if (!orders.length) {
      return res.status(404).json({ message: "Nu s-au găsit comenzi pentru acest utilizator." });
    }

    res.status(200).json({ message: "Comenzile au fost obținute cu succes.", orders });
  } catch (error) {
    next(error);
  }
};

// Obține datele utilizatorului autentificat
export const getAuthenticatedUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    res.status(200).json({ message: "Datele utilizatorului autentificat au fost obținute cu succes.", user });
  } catch (error) {
    next(error);
  }
};
