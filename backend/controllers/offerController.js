import Offer from "../models/Offer.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import { errorHandler } from "../utils/error.js";
import {createLog} from "../utils/createLog.js";
import PDFDocument from "pdfkit";
import mongoose from "mongoose";

// Creare oferta noua
export const createOffer = async (req, res, next) => {
  const { orderId, parts } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return next(errorHandler(400, "ID-ul cererii este invalid."));
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const order = await Order.findById(orderId).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, "Cererea de oferta nu a fost gasita."));
    }

    if (order.offerId) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, "Aceasta cerere are deja o oferta asociata."));
    }

    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, "Lista de piese este invalida sau goala."));
    }

    for (const part of parts) {
      if (
        typeof part.pricePerUnit !== "number" ||
        typeof part.quantity !== "number" ||
        part.pricePerUnit <= 0 ||
        part.quantity <= 0
      ) {
        await session.abortTransaction();
        session.endSession();
        return next(
          errorHandler(400, "Prețul per unitate și cantitatea trebuie sa fie valori numerice pozitive.")
        );
      }

      // Adauga opțiuni implicite pentru fiecare piesa
      part.options = [
        {
          manufacturer: part.manufacturer,
          price: part.pricePerUnit,
          description: `Alternativa oferita de ${part.manufacturer}`,
        },
      ];

      part.total = part.pricePerUnit * part.quantity; // Calculam totalul pentru fiecare piesa
    }

    const newOffer = new Offer({
      offerNumber: order.orderNumber,
      orderId: order._id,
      parts,
      total: parts.reduce((sum, part) => sum + part.total, 0),
    });

    const savedOffer = await newOffer.save({ session });

    order.offerId = savedOffer._id;
    order.status = "ofertat";
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Oferta a fost creata cu succes.",
      offer: savedOffer,
    });
  } catch (error) {
    next(error);
  }
};




// Ștergere oferta
export const deleteOffer = async (req, res, next) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const offer = await Offer.findByIdAndDelete(req.params.offerId).session(session);

    if (!offer) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, "Oferta nu a fost gasita."));
    }

    const order = await Order.findById(offer.orderId).session(session);
    if (order) {
      order.offerId = null;
      order.status = "asteptare_oferta";
      await order.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: "Oferta a fost ștearsa cu succes." });
  } catch (error) {
    next(error);
  }
};


// Selecția opțiunilor de catre client
export const selectOptions = async (req, res, next) => {
  const { selectedParts } = req.body;

  try {
    const offer = await Offer.findById(req.params.offerId);

    if (!offer) {
      return next(errorHandler(404, "Oferta nu a fost gasita."));
    }

    if (!selectedParts || !Array.isArray(selectedParts) || selectedParts.length === 0) {
      return next(errorHandler(400, "Lista de piese selectate este invalida sau inexistenta."));
    }

    // Mapam piesele selectate
    const updatedSelectedParts = offer.parts.filter((part) =>
      selectedParts.some((selected) => String(part._id) === String(selected.selectedOption))
    );

    if (updatedSelectedParts.length === 0) {
      return next(errorHandler(400, "Selecțiile clientului nu corespund pieselor disponibile."));
    }

    // Recalculam totalul pe baza pieselor selectate
    const updatedTotal = updatedSelectedParts.reduce(
      (sum, part) =>
        sum +
        (part.options.find((option) => String(option._id) === String(part.selectedOption))?.price || 0) *
          part.quantity,
      0
    );

    // Actualizam câmpul `selectedParts` și totalul
    offer.selectedParts = updatedSelectedParts;
    offer.total = updatedTotal;
    offer.status = "comanda_spre_finalizare";

    const updatedOffer = await offer.save();

    res.status(200).json({
      success: true,
      message: "Piesele selectate au fost salvate cu succes.",
      offer: updatedOffer,
    });
  } catch (error) {
    next(error);
  }
};







// Acceptarea ofertei

export const acceptOffer = async (req, res, next) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const offer = await Offer.findById(req.params.offerId).session(session);
    if (!offer) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, "Oferta nu a fost găsită."));
    }

    if (offer.status !== "comanda_spre_finalizare") {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, "Oferta nu poate fi acceptată în acest moment."));
    }

    offer.status = "oferta_acceptata";
    await offer.save({ session });

    const order = await Order.findById(offer.orderId).session(session);
    if (order) {
      order.status = "oferta_acceptata";
      await order.save({ session });
    }

    // Adaugă log-ul
    await createLog({
      action: "Offer Accepted",
      userId: req.user.id,
      orderId: offer.orderId,
      details: `Oferta cu numărul #${offer.offerNumber} a fost acceptată.`,
    });

    await session.commitTransaction();
    session.endSession();

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

    offer.status = "oferta_respinsa";
    await offer.save();

    const order = await Order.findById(offer.orderId);
    if (order) {
      order.status = "oferta_respinsa";
      await order.save();
    }

    // Adaugă log-ul
    await createLog({
      action: "Offer Rejected",
      userId: req.user.id,
      orderId: offer.orderId,
      details: `Oferta cu numărul #${offer.offerNumber} a fost respinsă.`,
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

    const order = await Order.findById(offer.orderId);
    if (order) {
      await createLog({
        action: "Delivery Status Updated",
        userId: req.user.id,
        orderId: order._id,
        details: `Statusul livrării pentru oferta #${offer.offerNumber} a fost actualizat la ${deliveryStatus}.`,
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

    // Obține cererile utilizatorului logat
    const userOrders = await Order.find({ userId: req.user.id }, "_id");
    const orderIds = userOrders.map(order => order._id);

    // Construiește filtrul pentru oferte
    const filters = { orderId: { $in: orderIds } };
    if (status) filters.status = status;

    // Gasește ofertele
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
    const { page = 1, limit = 10, status, search, sortBy = "createdAt", order = "desc" } = req.query;
    const filters = {};

    // Filtrare după status
    if (status) filters.status = status;

    // Căutare globală
    if (search) {
      filters.$or = [
        { offerNumber: { $regex: search, $options: "i" } },
        { "orderId.orderNumber": { $regex: search, $options: "i" } },
      ];
    }

    const offers = await Offer.find(filters)
      .populate("orderId", "orderNumber firstName lastName")
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
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


// Obținere oferta dupa ID
export const getOfferById = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.offerId).populate("orderId", "orderNumber firstName lastName");

    if (!offer) return next(errorHandler(404, "Oferta nu a fost gasita."));

    res.status(200).json({ success: true, offer });
  } catch (error) {
    next(error);
  }
};

// Obținere oferta pentru o comanda specifica (orderId)
export const getOfferByOrderId = async (req, res, next) => {
  try {
    const offer = await Offer.findOne({ orderId: req.params.orderId })
      .populate("orderId", "orderNumber firstName lastName")
      .populate("parts.selectedOption", "manufacturer price");

    if (!offer) {
      return next(errorHandler(404, "Oferta pentru aceasta comanda nu a fost gasita."));
    }

    res.status(200).json({ success: true, offer });
  } catch (error) {
    next(error);
  }
};

// Actualizare oferta
export const updateOffer = async (req, res, next) => {
  try {
    const { parts, status } = req.body;

    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return next(errorHandler(404, "Oferta nu a fost gasita."));

    // Actualizare piese
    if (parts) {
      for (const part of parts) {
        if (!part.partCode || !part.partType || !part.manufacturer || !part.pricePerUnit || !part.quantity) {
          return next(
            errorHandler(
              400,
              "Fiecare piesa trebuie sa conțina `partCode`, `partType`, `manufacturer`, `pricePerUnit` și `quantity`."
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
      const validStatuses = ["proiect", "trimisa", "comanda_spre_finalizare", "oferta_acceptata"];
      if (!validStatuses.includes(status)) {
        return next(errorHandler(400, "Status invalid."));
      }
      offer.status = status;
    }

    await offer.save();

    res.status(200).json({ success: true, message: "Oferta a fost actualizata cu succes.", offer });
  } catch (error) {
    next(error);
  }
};

// Actualizare piese selectate într-o oferta
export const updateSelectedParts = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const { selectedParts } = req.body;

    if (!selectedParts || selectedParts.length === 0) {
      return next(errorHandler(400, "Lista de piese selectate este invalida sau inexistenta."));
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return next(errorHandler(404, "Oferta nu a fost gasita."));
    }

    if (offer.status === "comanda_spre_finalizare") {
      return next(errorHandler(403, "Selecțiile nu pot fi modificate dupa ce oferta a fost trimisa pentru finalizare."));
    }

    const updatedSelectedParts = [];
    let updatedTotal = 0;

    offer.parts.forEach((part) => {
      const selectedPart = selectedParts.find(
        (p) => String(p.selectedOption) === String(part.options[0]._id)
      );

      if (selectedPart) {
        const selectedOption = part.options.find(
          (opt) => String(opt._id) === String(selectedPart.selectedOption)
        );

        if (selectedOption) {
          const partTotal = selectedOption.price * part.quantity;
          updatedTotal += partTotal;

          updatedSelectedParts.push({
            partCode: part.partCode,
            partType: part.partType,
            manufacturer: part.manufacturer,
            pricePerUnit: selectedOption.price,
            quantity: part.quantity,
            total: partTotal,
            selectedOption: selectedOption._id,
          });
        }
      }
    });

    offer.selectedParts = updatedSelectedParts;
    offer.total = updatedTotal;
    offer.status = "comanda_spre_finalizare";

    const updatedOffer = await offer.save();

    res.status(200).json({
      success: true,
      message: "Piesele selectate au fost actualizate cu succes.",
      offer: updatedOffer,
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
    if (!offer) return next(errorHandler(404, "Oferta nu a fost gasita."));

    // Verificam daca oferta este într-un status care permite modificarea
    if (offer.status !== "proiect") {
      return next(errorHandler(400, "Cantitațile pot fi actualizate doar pentru oferte în stadiul de proiect."));
    }

    // Actualizam cantitațile și recalculam totalul
    offer.parts.forEach((part) => {
      if (quantities[part.partCode]) {
        part.quantity = quantities[part.partCode];
        part.total = part.pricePerUnit * part.quantity;
      }
    });

    offer.total = offer.parts.reduce((sum, part) => sum + part.total, 0);
    await offer.save();

    res.status(200).json({ success: true, message: "Cantitațile au fost actualizate.", offer });
  } catch (error) {
    next(error);
  }
};


export const exportOffers = async (req, res, next) => {
  try {
    const { format = "csv" } = req.query;
    const offers = await Offer.find().populate("orderId", "orderNumber");

    if (format === "csv") {
      const csvData = offers.map((offer) =>
        [
          offer.offerNumber,
          offer.orderId.orderNumber,
          offer.total,
          offer.status,
          offer.createdAt.toISOString(),
        ].join(",")
      );
      csvData.unshift("OfferNumber,OrderNumber,Total,Status,CreatedAt"); // Header

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=offers.csv");
      res.status(200).send(csvData.join("\n"));
    } else if (format === "pdf") {
      const doc = new PDFDocument();
      doc.pipe(res);
      doc.fontSize(16).text("Raport Oferte", { align: "center" });
      doc.moveDown();
      offers.forEach((offer, index) => {
        doc
          .fontSize(12)
          .text(
            `${index + 1}. Oferta #${offer.offerNumber}, Total: ${offer.total} RON, Status: ${offer.status}, Data: ${offer.createdAt.toISOString()}`,
            { lineGap: 10 }
          );
      });
      doc.end();
    } else {
      res.status(400).json({ success: false, message: "Format invalid." });
    }
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


export const generateOfferPDF = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.offerId).populate("orderId");

    if (!offer) {
      return next(errorHandler(404, "Oferta nu a fost gasita."));
    }

    if (!offer.selectedParts || offer.selectedParts.length === 0) {
      doc.fontSize(14).text("Nu există produse selectate pentru această ofertă.", {
        align: "center",
      });
      doc.end();
      return doc.pipe(res);
    }

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=offer_${offer.offerNumber}.pdf`
    );

    // Titlul PDF-ului
    doc.fontSize(20).text(`Oferta #${offer.offerNumber}`, { align: "center" });
    doc.moveDown();

    // Detalii comanda
    doc.fontSize(12).text(`Numar comanda: ${offer.orderId.orderNumber}`);
    doc.text(`Data: ${new Date().toLocaleDateString("ro-RO")}`);
    doc.moveDown();

    // Tabel produse selectate
    doc.fontSize(14).text("Produse selectate:");
    doc.moveDown();
    offer.selectedParts.forEach((part, index) => {
      doc
        .fontSize(12)
        .text(
          `${index + 1}. ${part.partType} - ${part.manufacturer} - ${part.quantity} buc. - ${part.pricePerUnit} RON/buc. - Total: ${part.total} RON`
        );
    });

    // Total general
    doc.moveDown();
    doc.fontSize(14).text(`Total oferta: ${offer.total} RON`, {
      align: "right",
    });

    doc.end();
    doc.pipe(res);
  } catch (error) {
    next(error);
  }
};