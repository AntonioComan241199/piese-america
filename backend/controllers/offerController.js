import Offer from "../models/Offer.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import { errorHandler } from "../utils/error.js";

// Creare ofertă nouă
export const createOffer = async (req, res, next) => {
  const { orderId, parts } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return next(errorHandler(404, "Cererea de ofertă nu a fost găsită."));
    if (order.offerId) return next(errorHandler(400, "Această cerere are deja o ofertă asociată."));
    if (!parts || !Array.isArray(parts) || parts.length === 0)
      return next(errorHandler(400, "Lista de piese este invalidă sau goală."));

    // Verificăm validitatea câmpurilor pentru fiecare piesă
    for (const part of parts) {
      if (!part.partCode || !part.partType || !part.manufacturer || !part.pricePerUnit || !part.quantity) {
        return next(
          errorHandler(
            400,
            "Fiecare piesă trebuie să conțină `partCode`, `partType`, `manufacturer`, `pricePerUnit` și `quantity`."
          )
        );
      }
      part.total = part.pricePerUnit * part.quantity; // Calculăm totalul pentru fiecare piesă
    }

    const newOffer = new Offer({
      offerNumber: order.orderNumber,
      orderId: order._id,
      parts,
      total: parts.reduce((sum, part) => sum + part.total, 0), // Total general pentru ofertă
    });

    const savedOffer = await newOffer.save();

    order.offerId = savedOffer._id;
    order.status = "ofertat";
    await order.save();

    // Creează notificare pentru utilizator
    await Notification.create({
      userId: null, // Notificare generală pentru admini
      type: "acceptare_oferta",
      message: `Oferta #${offer.offerNumber} a fost acceptată. Total: ${offer.total.toFixed(2)} RON. Piese: ${
        offer.parts.map((p) => `${p.partCode} (${p.quantity} buc.)`).join(", ")
      }`,
    });

    res.status(201).json({ success: true, message: "Oferta a fost creată cu succes.", offer: savedOffer });
  } catch (error) {
    next(error);
  }
};

// Ștergere ofertă
export const deleteOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.offerId);

    if (!offer) {
      return next(errorHandler(404, "Oferta nu a fost găsită."));
    }

    // Actualizează comanda asociată
    const order = await Order.findById(offer.orderId);
    if (order) {
      order.offerId = null;
      order.status = "asteptare_oferta";
      await order.save();
    }

    res.status(200).json({ success: true, message: "Oferta a fost ștearsă cu succes." });
  } catch (error) {
    next(error);
  }
};


// Selecția opțiunilor de către client
export const selectOptions = async (req, res, next) => {
  const { selectedOptions } = req.body;

  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return next(errorHandler(404, "Oferta nu a fost găsită."));

    // Aplicăm selecțiile clientului
    offer.parts.forEach((part) => {
      const selectedOption = selectedOptions.find((opt) => opt.partType === part.partType);
      part.selectedOption = selectedOption ? selectedOption.optionId : null;
    });

    // Calculăm totalul doar pentru piesele cu opțiuni selectate
    offer.total = offer.parts.reduce((sum, part) => {
      if (part.selectedOption) {
        const selectedOption = part.options.find(
          (opt) => String(opt._id) === String(part.selectedOption)
        );
        return sum + (selectedOption ? selectedOption.price : 0);
      }
      return sum;
    }, 0);

    offer.status = "comanda_spre_finalizare";
    const updatedOffer = await offer.save();

    const order = await Order.findById(offer.orderId);
    if (order) {
      order.status = "comanda_spre_finalizare";
      await order.save();
    }

    // Notifică adminul despre selecțiile clientului
    await Notification.create({
      userId: null, // Notificare pentru admin
      type: "selectie_client",
      message: `Clientul a făcut selecții pentru oferta #${offer.offerNumber}.`,
    });

    res.status(200).json({
      success: true,
      message: "Selecțiile au fost salvate cu succes. Piesele fără selecție nu vor fi incluse în ofertă.",
      offer: updatedOffer,
    });
  } catch (error) {
    next(error);
  }
};

// Acceptarea ofertei
export const acceptOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return next(errorHandler(404, "Oferta nu a fost găsită."));
    if (offer.status !== "comanda_spre_finalizare") {
      return next(errorHandler(400, "Oferta nu poate fi acceptată în acest moment."));
    }

    offer.status = "finalizat";
    await offer.save();

    const order = await Order.findById(offer.orderId);
    if (order) {
      order.status = "finalizare";
      await order.save();
    }

    // Notifică adminul despre acceptarea ofertei
    await Notification.create({
      userId: null, // Notificare pentru admin
      type: "acceptare_oferta",
      message: `Oferta #${offer.offerNumber} a fost acceptată de client.`,
    });

    res.status(200).json({ success: true, message: "Oferta a fost acceptată cu succes.", offer });
  } catch (error) {
    next(error);
  }
};

// Respingerea ofertei
export const rejectOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return next(errorHandler(404, "Oferta nu a fost găsită."));
    if (offer.status !== "comanda_spre_finalizare") {
      return next(errorHandler(400, "Oferta nu poate fi respinsă în acest moment."));
    }

    offer.status = "proiect";
    await offer.save();

    const order = await Order.findById(offer.orderId);
    if (order) {
      order.status = "asteptare_oferta";
      await order.save();
    }

    // Notifică adminul despre respingerea ofertei
    await Notification.create({
      userId: null, // Notificare pentru admin
      type: "respingere_oferta",
      message: `Oferta #${offer.offerNumber} a fost respinsă de client.`,
    });

    res.status(200).json({ success: true, message: "Oferta a fost respinsă cu succes.", offer });
  } catch (error) {
    next(error);
  }
};

// Actualizare status livrare
export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { deliveryStatus } = req.body;

    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return next(errorHandler(404, "Oferta nu a fost găsită."));

    offer.status = deliveryStatus;
    await offer.save();

    // Notifică utilizatorul despre livrare
    const order = await Order.findById(offer.orderId);
    if (order) {
      await Notification.create({
        userId: order.userId,
        type: "status_livrare",
        message: `Statusul livrării pentru oferta #${offer.offerNumber} a fost actualizat la ${deliveryStatus}.`,
      });
    }

    res.status(200).json({ success: true, message: "Statusul livrării a fost actualizat cu succes." });
  } catch (error) {
    next(error);
  }
};

export const getUserOffers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filters = { orderId: req.user.id }; // Filtrare doar pentru utilizatorul curent

    if (status) filters.status = status;

    const offers = await Offer.find(filters)
      .populate("orderId", "orderNumber firstName lastName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalOffers = await Offer.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: offers,
      pagination: {
        total: totalOffers,
        page: parseInt(page),
        pages: Math.ceil(totalOffers / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};


// Obținerea tuturor ofertelor
export const getAllOffers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filters = {};

    // Filtrare după status
    if (status) filters.status = status;

    const offers = await Offer.find(filters)
      .populate("orderId", "orderNumber firstName lastName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalOffers = await Offer.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: offers,
      pagination: {
        total: totalOffers,
        page: parseInt(page),
        pages: Math.ceil(totalOffers / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Obținere ofertă după ID
export const getOfferById = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.offerId).populate("orderId", "orderNumber firstName lastName");

    if (!offer) return next(errorHandler(404, "Oferta nu a fost găsită."));

    res.status(200).json({ success: true, offer });
  } catch (error) {
    next(error);
  }
};

// Obținere ofertă pentru o comandă specifică (orderId)
export const getOfferByOrderId = async (req, res, next) => {
  try {
    const offer = await Offer.findOne({ orderId: req.params.orderId })
      .populate("orderId", "orderNumber firstName lastName")
      .populate("parts.selectedOption", "manufacturer price");

    if (!offer) {
      return next(errorHandler(404, "Oferta pentru această comandă nu a fost găsită."));
    }

    res.status(200).json({ success: true, offer });
  } catch (error) {
    next(error);
  }
};

// Actualizare ofertă
export const updateOffer = async (req, res, next) => {
  try {
    const { parts, status } = req.body;

    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return next(errorHandler(404, "Oferta nu a fost găsită."));

    // Actualizare piese
    if (parts) {
      for (const part of parts) {
        if (!part.partCode || !part.partType || !part.manufacturer || !part.pricePerUnit || !part.quantity) {
          return next(
            errorHandler(
              400,
              "Fiecare piesă trebuie să conțină `partCode`, `partType`, `manufacturer`, `pricePerUnit` și `quantity`."
            )
          );
        }
        part.total = part.pricePerUnit * part.quantity;
      }
      offer.parts = parts;
      offer.total = parts.reduce((sum, part) => sum + part.total, 0);
    }

    // Actualizare status
    if (status) {
      const validStatuses = ["proiect", "trimisa", "comanda_spre_finalizare", "finalizat"];
      if (!validStatuses.includes(status)) {
        return next(errorHandler(400, "Status invalid."));
      }
      offer.status = status;
    }

    await offer.save();

    res.status(200).json({ success: true, message: "Oferta a fost actualizată cu succes.", offer });
  } catch (error) {
    next(error);
  }
};

// Actualizare piese selectate într-o ofertă
export const updateSelectedParts = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const { selectedParts } = req.body;

    const offer = await Offer.findById(offerId);
    if (!offer) return next(errorHandler(404, "Oferta nu a fost găsită."));

    // Actualizăm piesele selectate
    offer.parts.forEach((part) => {
      const selectedPart = selectedParts.find((p) => p.partType === part.partType);
      if (selectedPart) {
        part.selectedOption = selectedPart.selectedOption;
      }
    });

    // Recalculăm totalul pentru piesele selectate
    offer.total = offer.parts.reduce((sum, part) => {
      const selectedOption = part.options.find(
        (opt) => String(opt._id) === String(part.selectedOption)
      );
      return sum + (selectedOption ? selectedOption.price : 0);
    }, 0);

    await offer.save();

    res.status(200).json({
      success: true,
      message: "Piesele selectate au fost actualizate cu succes.",
      offer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuantities = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const { quantities } = req.body; // Ex.: { "partCode": 2, "partCode2": 3 }

    const offer = await Offer.findById(offerId);
    if (!offer) return next(errorHandler(404, "Oferta nu a fost găsită."));

    // Verificăm dacă oferta este într-un status care permite modificarea
    if (offer.status !== "proiect") {
      return next(errorHandler(400, "Cantitățile pot fi actualizate doar pentru oferte în stadiul de proiect."));
    }

    // Actualizăm cantitățile și recalculăm totalul
    offer.parts.forEach((part) => {
      if (quantities[part.partCode]) {
        part.quantity = quantities[part.partCode];
        part.total = part.pricePerUnit * part.quantity;
      }
    });

    offer.total = offer.parts.reduce((sum, part) => sum + part.total, 0);
    await offer.save();

    res.status(200).json({ success: true, message: "Cantitățile au fost actualizate.", offer });
  } catch (error) {
    next(error);
  }
};


export const exportOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find().populate("orderId", "orderNumber firstName lastName");

    // Creăm un CSV sau Excel din oferte
    const csvData = offers.map((offer) => ({
      offerNumber: offer.offerNumber,
      orderId: offer.orderId.orderNumber,
      total: offer.total,
      status: offer.status,
      createdAt: offer.createdAt,
    }));

    // Convertim în format CSV/Excel (poți folosi un modul ca `json2csv` sau `exceljs`)
    const csvContent = "OfferNumber,OrderNumber,Total,Status,CreatedAt\n" + 
                       csvData.map(row => `${row.offerNumber},${row.orderId},${row.total},${row.status},${row.createdAt}`).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=offers.csv");
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};


export const getOfferStats = async (req, res, next) => {
  try {
    const stats = await Offer.aggregate([
      { $group: { _id: { $month: "$createdAt" }, total: { $sum: "$total" }, count: { $sum: 1 } } },
      { $sort: { "_id": 1 } },
    ]);

    res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};
