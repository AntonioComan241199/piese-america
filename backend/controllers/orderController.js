import Order from "../models/Order.js";
import Counter from "../models/Counter.js";
import Notification from "../models/Notification.js";
import { errorHandler } from "../utils/error.js";

// Creare cerere de ofertă
export const createOrder = async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    carMake,
    carModel,
    carYear,
    fuelType,
    enginePower,
    engineSize,
    transmission,
    vin,
    partDetails,
    userType,
    companyDetails,
  } = req.body;

  try {
    // Validare date în funcție de userType
    if (userType === "persoana_fizica") {
      if (!firstName || !lastName) {
        return next(errorHandler(400, "Prenumele și numele sunt obligatorii pentru persoanele fizice."));
      }
    } else if (userType === "persoana_juridica") {
      if (!companyDetails?.companyName || !companyDetails?.cui || !companyDetails?.nrRegCom) {
        return next(errorHandler(400, "Detaliile companiei sunt obligatorii pentru persoanele juridice."));
      }
    }

    const counter = await Counter.findOneAndUpdate(
      { name: "orderNumber" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const orderNumber = counter.value;

    const newOrder = new Order({
      orderNumber,
      userId: req.user.id,
      userType,
      firstName,
      lastName,
      companyDetails: userType === "persoana_juridica" ? companyDetails : {},
      email,
      phoneNumber,
      carMake,
      carModel,
      carYear,
      fuelType,
      enginePower,
      engineSize,
      transmission,
      vin,
      partDetails,
    });

    await newOrder.save();

    // Notificare pentru admini
    await Notification.create({
      userId: null, // Notificare generală pentru admini
      type: "cerere_noua",
      message: `O cerere de ofertă a fost creată de ${
        userType === "persoana_fizica"
          ? `${firstName} ${lastName} (${email}, Tel: ${phoneNumber})`
          : `${companyDetails.companyName} (${email}, Tel: ${phoneNumber})`
      }, cu număr cerere: #${orderNumber}.`,
    });

    res.status(201).json({ success: true, message: "Cererea de ofertă a fost creată cu succes!", order: newOrder });
  } catch (error) {
    next(error);
  }
};

const handleDateChange = (e) => {
  const localDate = new Date(e.target.value); // Data locală selectată
  const utcDate = new Date(localDate.toISOString()); // Convertim la UTC
  setStartDate(utcDate.toISOString()); // Salvăm data în UTC
};


// Obținerea cererilor de ofertă cu filtrare corectă pe intervalul de date
// Obținerea cererilor de ofertă cu filtrare corectă pe intervalul de date
export const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, orderNumber, selectedDate, phoneNumber } = req.query;
    const filters = {};

    // Filtrare după status
    if (status) filters.status = status;

    // Filtrare după număr ofertă
    if (orderNumber) filters.orderNumber = orderNumber;

    // Filtrare după numărul de telefon
    if (phoneNumber) {
      filters.phoneNumber = { $regex: phoneNumber, $options: "i" };  // Filtrare case-insensitive
    }

    // Filtrare pe o singură dată (selectedDate)
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);
      filters.orderDate = { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() };
    }

    // Căutare cereri în baza filtrelor aplicate
    const orders = await Order.find(filters)
      .populate("userId", "email firstName lastName")
      .populate("offerId", "offerNumber status total")
      .sort({ orderDate: -1 })  // Ordine descrescătoare pe orderDate
      .skip((page - 1) * limit) // Paginare
      .limit(parseInt(limit)); // Limitează numărul de cereri returnate

    // Calcularea numărului total de cereri care se potrivesc filtrelor
    const totalOrders = await Order.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total: totalOrders,
        page: parseInt(page),
        pages: Math.ceil(totalOrders / limit), // Calcularea numărului de pagini
      },
    });
  } catch (error) {
    next(error);
  }
};





// Export cereri de ofertă
export const exportOrders = async (req, res, next) => {
  try {
    const { format = "csv" } = req.query;
    const orders = await Order.find().populate("userId", "email firstName lastName");

    if (format === "csv") {
      const csvData = orders.map((order) =>
        [
          order.orderNumber,
          order.userType === "persoana_fizica"
            ? `${order.firstName} ${order.lastName}`
            : order.companyDetails.companyName,
          order.email,
          order.phoneNumber,
          order.status,
        ].join(",")
      );
      csvData.unshift("OrderNumber,Name,Email,PhoneNumber,Status"); // Header

      const filePath = path.join(__dirname, "..", "exports", `orders-${Date.now()}.csv`);
      fs.writeFileSync(filePath, csvData.join("\n"));

      res.download(filePath);
    } else {
      res.status(400).json({ success: false, message: "Formatul de export nu este suportat." });
    }
  } catch (error) {
    next(error);
  }
};

// Obținere cererile unui utilizator
export const getUserOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, orderNumber, orderDate } = req.query;

    const filters = { userId: req.user.id };

    // Filtrare după status
    if (status) filters.status = status;

    // Filtrare după numărul comenzii
    if (orderNumber) filters.orderNumber = orderNumber;

    // Filtrare pe o singură dată (orderDate)
    if (orderDate) {
      const startOfDay = new Date(orderDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);
      filters.orderDate = { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() };
    }

    const orders = await Order.find(filters)
      .populate("userId", "email firstName lastName")
      .populate("offerId", "offerNumber status total")
      .sort({ orderDate: -1 })  // Ordine descrescătoare pe orderDate
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total: totalOrders,
        page: parseInt(page),
        pages: Math.ceil(totalOrders / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};


// Obținere detalii comandă
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "email firstName lastName")
      .populate("offerId", "offerNumber parts total");

    if (!order) {
      return next(errorHandler(404, "Cererea de ofertă nu a fost găsită."));
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

// Actualizare status cerere
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ["asteptare_oferta", "ofertat", "comanda_spre_finalizare", "finalizare", "livrat"];
    if (!validStatuses.includes(status)) {
      return next(errorHandler(400, "Status invalid."));
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return next(errorHandler(404, "Cererea de ofertă nu a fost găsită."));
    }

    await Notification.create({
      userId: order.userId,
      type: "actualizare_status",
      message: `Statusul comenzii #${order.orderNumber} a fost actualizat la ${status}.`,
    });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// Adăugare comentariu la cerere
export const addCommentToOrder = async (req, res, next) => {
  try {
    const { text } = req.body;

    // Caută cererea după ID
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(errorHandler(404, "Cererea de ofertă nu a fost găsită."));
    }

    // Determină numele utilizatorului în funcție de tipul de utilizator
    let userName;
    if (req.user.role === "admin") {
      userName = "Admin";
    } else if (req.user.userType === "persoana_fizica") {
      userName = `${req.user.firstName} ${req.user.lastName}`;
    } else if (req.user.userType === "persoana_juridica" && req.user.companyDetails?.companyName) {
      userName = req.user.companyDetails.companyName;
    } else {
      userName = "Utilizator necunoscut";
    }

    // Creează comentariul
    const comment = {
      text,
      user: userName,
    };

    // Adaugă comentariul la cerere și salvează
    order.comments.push(comment);
    await order.save();

    res.status(200).json({ success: true, comments: order.comments });
  } catch (error) {
    next(error);
  }
};


// Ștergere cerere de ofertă
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return next(errorHandler(404, "Cererea de ofertă nu a fost găsită."));
    }

    res.status(200).json({ success: true, message: "Cererea de ofertă a fost ștearsă cu succes." });
  } catch (error) {
    next(error);
  }
};