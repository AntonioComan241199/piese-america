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



// Obținere toate cererile de ofertă
export const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, userType, search } = req.query;
    const filters = {};

    // Filtrare după status
    if (status) filters.status = status;

    // Filtrare după tipul utilizatorului
    if (userType) filters.userType = userType;

    // Căutare globală (în funcție de tipul de utilizator)
    if (search) {
      if (userType === "persoana_fizica") {
        filters.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ];
      } else if (userType === "persoana_juridica") {
        filters.$or = [
          { "companyDetails.companyName": { $regex: search, $options: "i" } },
          { "companyDetails.cui": { $regex: search, $options: "i" } },
        ];
      } else {
        filters.$or = [
          { email: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
          { orderNumber: { $regex: search, $options: "i" } },
        ];
      }
    }

    const orders = await Order.find(filters)
      .populate("userId", "email firstName lastName")
      .populate("offerId", "offerNumber status total")
      .sort({ createdAt: -1 })
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
    // Nu mai verificăm `req.params.userId`
    const orders = await Order.find({ userId: req.user.id });

    res.status(200).json({ success: true, data: orders });
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

    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(errorHandler(404, "Cererea de ofertă nu a fost găsită."));
    }

    const comment = {
      text,
      user: req.user.role === "admin" ? "Admin" : `${req.user.firstName} ${req.user.lastName}`,
    };

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