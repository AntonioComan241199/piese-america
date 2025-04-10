import Offer from "../models/Offer.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import { errorHandler } from "../utils/error.js";
import {createLog} from "../utils/createLog.js";
import PDFDocument from "pdfkit";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";


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

  if (!Array.isArray(selectedParts) || selectedParts.length === 0) {
    return next(errorHandler(400, "Lista de piese selectate este invalidă sau goală."));
  }

  try {
    const offer = await Offer.findById(req.params.offerId);

    if (!offer) {
      return next(errorHandler(404, "Oferta nu a fost găsită."));
    }

    const updatedSelectedParts = offer.parts.filter((part) =>
      selectedParts.some((selected) => String(part._id) === String(selected.selectedOption))
    );

    if (updatedSelectedParts.length === 0) {
      return next(errorHandler(400, "Selecțiile clientului nu corespund pieselor disponibile."));
    }

    // Actualizare în baza de date
    offer.selectedParts = updatedSelectedParts;
    offer.total = updatedSelectedParts.reduce(
      (sum, part) => sum + part.total,
      0
    );

    await offer.save();

    res.status(200).json({
      success: true,
      message: "Piesele selectate au fost salvate cu succes.",
      offer,
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



    offer.status = "oferta_acceptata";
    await offer.save({ session });

    const order = await Order.findById(offer.orderId).session(session);
    if (order) {
      order.status = "oferta_acceptata";
      await order.save({ session });
    }

    await createLog({
      action: "Oferta acceptată",
      userId: req.user.id,
      orderId: offer.orderId,
      details: `Oferta cu numărul #${offer.offerNumber} a fost acceptată.`,
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Oferta a fost acceptată cu succes.",
      offer,
    });
  } catch (error) {
    next(error);
  }
};



// Respingerea ofertei
export const rejectOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return next(errorHandler(404, "Oferta nu a fost găsită."));



    offer.status = "anulata";
    await offer.save();

    const order = await Order.findById(offer.orderId);
    if (order) {
      order.status = "anulata";
      await order.save();
    }

    await createLog({
      action: "Oferta anulată",
      userId: req.user.id,
      orderId: offer.orderId,
      details: `Oferta cu numărul #${offer.offerNumber} a fost anulată.`,
    });

    res.status(200).json({ success: true, message: "Oferta a fost anulată cu succes.", offer });
  } catch (error) {
    next(error);
  }
};



// Actualizare status livrare
export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { deliveryStatus } = req.body;

    const validStatuses = ["livrare_in_procesare", "livrata", "anulata"];
    if (!validStatuses.includes(deliveryStatus)) {
      return next(errorHandler(400, "Statusul de livrare este invalid."));
    }

    const offer = await Offer.findById(req.params.offerId);
    if (!offer) {
      return next(errorHandler(404, "Oferta nu a fost găsită."));
    }

    // Verificăm dacă statusul livrării este corect
    if (
      deliveryStatus === "livrata" &&
      offer.status !== "livrare_in_procesare"
    ) {
      return next(errorHandler(400, "Livrarea poate fi finalizată doar dacă este în proces."));
    }

    // Actualizez statusul ofertei
    offer.status = deliveryStatus;
    await offer.save();

    // Actualizare status cerere asociată (Order)
    const order = await Order.findById(offer.orderId);
    if (!order) {
      return next(errorHandler(404, "Cererea asociată ofertei nu a fost găsită."));
    }

    // Schimbăm statusul cererii în funcție de statusul livrării ofertei
    if (deliveryStatus === "livrata") {
      order.status = "livrata";  // Dacă oferta este livrată, setăm cererea la "livrata"
    } else if (deliveryStatus === "anulata") {
      order.status = "anulata";  // Dacă oferta este anulată, setăm cererea la "anulata"
    } else if (deliveryStatus === "livrare_in_procesare") {
      order.status = "livrare_in_procesare";  // Dacă livrarea este în proces, cererea devine "comanda_spre_finalizare"
    }

    await order.save();  // Salvează cererea cu noul status

    // Crearea unui log pentru această actualizare
    await createLog({
      action: "Actualizare status livrare",
      userId: req.user.id,
      orderId: offer.orderId,
      details: `Statusul livrării pentru oferta #${offer.offerNumber} a fost actualizat la ${deliveryStatus}.`,
    });

    res.status(200).json({
      success: true,
      message: "Statusul livrării a fost actualizat cu succes.",
      offer,
    });
  } catch (error) {
    next(error);
  }
};



export const getUserOffers = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      startDate, 
      endDate, 
      orderId, 
      offerNumber, 
      selectedDate  // Adăugăm selectedDate
    } = req.query;

    const filters = {};

    // Filtrare după status
    if (status) {
      const validStatuses = [
        "proiect",
        "trimisa",
        "oferta_acceptata",
        "livrare_in_procesare",
        "livrata",
        "anulata",
      ];
      if (!validStatuses.includes(status)) {
        return next(errorHandler(400, "Status invalid."));
      }
      filters.status = status;
    }

    // Filtrare pe o singură dată selectată (selectedDate)
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);  // Setăm la 00:00:00 ora de început

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);  // Setăm la 23:59:59 ora de sfârșit

      filters.createdAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return next(errorHandler(400, "Data de început este invalidă."));
        }
        dateFilter.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return next(errorHandler(400, "Data de sfârșit este invalidă."));
        }
        dateFilter.$lte = end;
      }
      filters.createdAt = dateFilter;
    }

    // Filtrare după numărul de ofertă
    if (offerNumber && isNaN(Number(offerNumber))) {
      return next(errorHandler(400, "Numărul ofertei trebuie să fie numeric."));
    }

    // Obține cererile utilizatorului logat
    let userOrders = await Order.find({ userId: req.user.id }, "_id");
    if (orderId) {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return next(errorHandler(400, "ID-ul comenzii este invalid."));
      }
      userOrders = userOrders.filter((order) => String(order._id) === String(orderId));
    }

    const orderIds = userOrders.map((order) => order._id);

    // Construiește filtrul pentru oferte
    filters.orderId = { $in: orderIds };
    if (offerNumber) filters.offerNumber = Number(offerNumber);

    // Găsește ofertele
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
    const { 
      page = 1, 
      limit = 10, 
      status, 
      offerNumber, 
      startDate, 
      endDate, 
      phoneNumber, 
      selectedDate, // Adăugăm selectedDate pentru filtrare pe o singură dată
      partCode,
      sortBy = "createdAt", 
      order = "desc" 
    } = req.query;

    const filters = {};

    // Filtrare după status
    if (status) {
      const validStatuses = [
        "proiect", "trimisa", "oferta_acceptata", 
        "livrare_in_procesare", "livrata", "anulata"
      ];
      if (!validStatuses.includes(status)) {
        return next(errorHandler(400, "Status invalid."));
      }
      filters.status = status;
    }

    // Filtrare după numărul ofertei
    if (offerNumber) {
      if (isNaN(Number(offerNumber))) {
        return next(errorHandler(400, "Numărul ofertei trebuie să fie numeric."));
      }
      filters.offerNumber = Number(offerNumber);
    }

    // Filtrare pe o singură dată selectată pentru `createdAt`
    if (selectedDate) {
      // Convertim selectedDate într-un format ISO 8601 (fără ora)
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0); // Setăm la 00:00:00 ora de început
    
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999); // Setăm la 23:59:59 ora de sfârșit
    
      filters.createdAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return next(errorHandler(400, "Data de început este invalidă."));
        }
        dateFilter.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return next(errorHandler(400, "Data de sfârșit este invalidă."));
        }
        dateFilter.$lte = end;
      }
      filters.createdAt = dateFilter;
    }

    // Filtrare după numărul de telefon (dacă e necesar)
    if (phoneNumber) {
      filters["orderId.phoneNumber"] = phoneNumber;
    }

    if (partCode) {
      filters["selectedParts.partCode"] = partCode; // Căutare în subdocumente
    }

    // Interogare pentru a găsi ofertele care corespund filtrului
    const offers = await Offer.find(filters)
      .populate({
        path: "orderId", 
        select: "phoneNumber orderNumber firstName lastName", // selectăm phoneNumber din Order
      })
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





const getOffersByPhoneNumber = async (phoneNumber) => {
  try {
    const offers = await db.collection("offersWithPhoneNumber").find({ "orderDetails.phoneNumber": phoneNumber }).toArray();
    return offers;
  } catch (error) {
    console.error("Eroare la obținerea ofertelor:", error);
    throw error;
  }
};





// Obținere oferta dupa ID
export const getOfferById = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.offerId)
      .populate({
        path: "orderId",
        select: "orderNumber userId userType firstName lastName companyDetails email phoneNumber carMake carModel carYear fuelType enginePower engineSize transmission vin partDetails status",
        populate: {
          path: "userId",
          select: "email firstName lastName", // Detalii adiționale dacă sunt relevante
        },
      });

    if (!offer) {
      return next(errorHandler(404, "Oferta nu a fost găsită."));
    }

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
      const validStatuses = ["proiect", "trimisa", "oferta_acceptata"];
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

export const updateOfferStatus = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;

    // Verificare status valid
    const validStatuses = ["proiect", "oferta_acceptata", "oferta_respinsa"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Status invalid." });
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: "Oferta nu a fost găsită." });
    }

    offer.status = status;
    await offer.save();

    res.status(200).json({
      success: true,
      message: `Statusul ofertei a fost actualizat la ${status}.`,
      offer,
    });
  } catch (error) {
    next(error);
  }
};

// Actualizare piese selectate într-o oferta
export const updateSelectedParts = async (req, res, next) => {
  const { offerId } = req.params;
  const { selectedParts, billingAddress, deliveryAddress, pickupAtCentral } = req.body;

  try {
    if (!selectedParts || !Array.isArray(selectedParts) || selectedParts.length === 0) {
      return next(errorHandler(400, "Lista de piese selectate este invalidă sau goală."));
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return next(errorHandler(404, "Oferta nu a fost găsită."));
    }

    if (offer.status !== "proiect" && offer.status !== "trimisa") {
      return next(errorHandler(403, "Selecțiile nu pot fi modificate după ce oferta este în proces de finalizare."));
    }

    const updatedSelectedParts = [];
    let updatedTotal = 0;

    // Mapare și recalculare total
    offer.parts.forEach((part) => {
      const selectedPart = selectedParts.find(
        (p) => String(p.selectedOption) === String(part.options[0]?._id)
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

    if (updatedSelectedParts.length === 0) {
      return next(errorHandler(400, "Selecțiile pieselor nu corespund pieselor disponibile."));
    }

    // Actualizare ofertă
    offer.selectedParts = updatedSelectedParts;
    offer.total = updatedTotal;
    offer.billingAddress = billingAddress;
    offer.deliveryAddress = pickupAtCentral ? null : deliveryAddress;
    offer.pickupAtCentral = pickupAtCentral;

    const updatedOffer = await offer.save();

    res.status(200).json({
      success: true,
      message: "Piesele selectate și adresele au fost actualizate cu succes.",
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

export const sendOfferEmail = async (req, res, next) => {
  const { offerNumber } = req.body; // Nu mai trebuie email-ul în body

  if (!offerNumber) {
    return next(errorHandler(400, "Numărul ofertei nu este furnizat."));
  }

  try {
    // Căutăm oferta folosind offerNumber și populăm orderId pentru a obține email-ul
    const offer = await Offer.findOne({ offerNumber }).populate("orderId", "email");

    if (!offer || !offer.orderId) {
      return next(errorHandler(404, "Oferta sau comanda asociată nu a fost găsită."));
    }

    const orderEmail = offer.orderId.email;

    if (!orderEmail) {
      return next(errorHandler(400, "Adresa de email nu a fost găsită în comanda asociată."));
    }

    // Construim link-ul către oferta online, utilizând offerId
    const offerLink = `http://localhost:5173/offer/${offer._id}`; // Modifică acest link conform aplicației tale

    const transporter = nodemailer.createTransport({
      service: "SendGrid", // Folosim serviciul SendGrid pentru trimiterea email-urilor
      auth: {
        user: "apikey", // Folosește "apikey" ca user
        pass: process.env.SENDGRID_API_KEY, // Cheia API de la SendGrid
      },
    });

    const mailOptions = {
      from: "antonio.coman99@gmail.com", // Asigură-te că folosești o adresă validă
      to: orderEmail, // Adresa destinatarului
      subject: `Piese Auto America - Oferta #${offerNumber} pentru comanda ta`,
      text: `Aceasta este oferta #${offerNumber} trimisă pentru comanda ta. Detalii sunt disponibile la acest link: ${offerLink}.`,
      html: `<h1>Oferta #${offerNumber}</h1><p>Ai primit această ofertă pentru comanda ta. Detalii sunt disponibile la acest link:</p><a href="${offerLink}">${offerLink}</a>`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Email-ul cu link-ul ofertei a fost trimis cu succes." });
  } catch (error) {
    console.error("Eroare la trimiterea email-ului:", error);
    return next(errorHandler(500, "Eroare la trimiterea email-ului: " + error.message));
  }
};


export const finalizeOffer = async (req, res, next) => {
  const { billingAddress, deliveryAddress, pickupAtCentral, selectedParts } = req.body;

  try {
    const offer = await Offer.findById(req.params.offerId);

    if (!offer) {
      return next(errorHandler(404, "Oferta nu a fost găsită."));
    }

    if (!selectedParts || selectedParts.length === 0) {
      return next(errorHandler(400, "Selecțiile pieselor sunt necesare."));
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
    offer.billingAddress = billingAddress;
    offer.deliveryAddress = pickupAtCentral ? null : deliveryAddress;
    offer.pickupAtCentral = pickupAtCentral;

    const updatedOffer = await offer.save();

    res.status(200).json({
      success: true,
      message: "Oferta a fost finalizată cu succes.",
      offer: updatedOffer,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptOfferEmail = async (req, res, next) => {
  const { offerNumber } = req.body;

  if (!offerNumber) {
    return next(errorHandler(400, "Numărul ofertei nu este furnizat."));
  }

  try {
    // Găsim oferta pe baza offerNumber și populăm datele comenzii
    const offer = await Offer.findOne({ offerNumber }).populate("orderId", "email");

    if (!offer) {
      return next(errorHandler(404, "Oferta nu a fost găsită."));
    }

    const adminEmail = process.env.ADMIN_EMAIL; // Adresa administratorului din variabilele de mediu
    const offerLink = `http://localhost:5173/offer/${offer._id}`; // Link-ul către oferta acceptată

    const transporter = nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });

    const mailOptions = {
      from: "antonio.coman99@gmail.com", // Adresa expeditorului
      to: "antonio.coman99@gmail.com", // Email-ul administratorului
      subject: `Oferta #${offerNumber} a fost acceptată`,
      text: `Oferta #${offerNumber} a fost acceptată de client. Poți vizualiza oferta aici: ${offerLink}.`,
      html: `
        <h1>Oferta #${offerNumber} a fost acceptată</h1>
        <p>Clientul a acceptat această ofertă.</p>
        <p><a href="${offerLink}">Vizualizează oferta</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Email-ul de acceptare a fost trimis administratorului cu succes." });
  } catch (error) {
    console.error("Eroare la trimiterea email-ului:", error);
    return next(errorHandler(500, "Eroare la trimiterea email-ului: " + error.message));
  }
};

export const rejectOfferEmail = async (req, res, next) => {
  const { offerNumber } = req.body;

  if (!offerNumber) {
    return next(errorHandler(400, "Numărul ofertei nu este furnizat."));
  }

  try {
    // Găsim oferta pe baza offerNumber și populăm datele comenzii
    const offer = await Offer.findOne({ offerNumber }).populate("orderId", "email");

    if (!offer) {
      return next(errorHandler(404, "Oferta nu a fost găsită."));
    }

    const adminEmail = process.env.ADMIN_EMAIL; // Adresa administratorului din variabilele de mediu
    const offerLink = `http://localhost:5173/offer/${offer._id}`; // Link-ul către oferta respinsă

    const transporter = nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });

    const mailOptions = {
      from: "antonio.coman99@gmail.com", // Adresa expeditorului
      to: "antonio.coman99@gmail.com", // Email-ul administratorului
      subject: `Oferta #${offerNumber} a fost respinsă`,
      text: `Oferta #${offerNumber} a fost respinsă de client. Poți vizualiza oferta aici: ${offerLink}.`,
      html: `
        <h1>Oferta #${offerNumber} a fost respinsă</h1>
        <p>Clientul a respins această ofertă.</p>
        <p><a href="${offerLink}">Vizualizează oferta</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Email-ul de respingere a fost trimis administratorului cu succes." });
  } catch (error) {
    console.error("Eroare la trimiterea email-ului:", error);
    return next(errorHandler(500, "Eroare la trimiterea email-ului: " + error.message));
  }
};


export const updateOfferProducts = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const { updatedProducts } = req.body;

    // Validare
    if (!Array.isArray(updatedProducts)) {
      return next(errorHandler(400, "Lista de produse actualizată este invalidă."));
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return next(errorHandler(404, "Oferta nu a fost găsită."));
    }

    // Verificăm dacă oferta poate fi editată
    if (!["proiect", "trimisa"].includes(offer.status)) {
      return next(errorHandler(400, "Oferta nu mai poate fi editată în statusul curent."));
    }

    // Validăm și procesăm fiecare produs
    const processedProducts = updatedProducts.map(product => {
      if (!product.partCode || !product.partType || !product.manufacturer || 
          !product.pricePerUnit || !product.quantity) {
        throw new Error("Toate câmpurile produsului sunt obligatorii.");
      }

      if (product.pricePerUnit <= 0 || product.quantity <= 0) {
        throw new Error("Prețul și cantitatea trebuie să fie valori pozitive.");
      }

      return {
        ...product,
        total: product.pricePerUnit * product.quantity,
        options: [{
          manufacturer: product.manufacturer,
          price: product.pricePerUnit,
          description: `Opțiune de la ${product.manufacturer}`
        }]
      };
    });

    // Actualizăm oferta
    offer.parts = processedProducts;
    offer.total = processedProducts.reduce((sum, part) => sum + part.total, 0);
    
    // Adăugăm log pentru audit
    offer.logs.push({
      timestamp: new Date(),
      userId: req.user.id,
      action: "Actualizare produse",
      details: `Produsele ofertei au fost actualizate. Număr produse: ${processedProducts.length}`
    });

    const updatedOffer = await offer.save();

    res.status(200).json({
      success: true,
      message: "Produsele au fost actualizate cu succes.",
      offer: updatedOffer
    });

  } catch (error) {
    if (error.message.includes("Toate câmpurile") || 
        error.message.includes("Prețul și cantitatea")) {
      return next(errorHandler(400, error.message));
    }
    next(error);
  }
};

export const addOfferProducts = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const { newProducts } = req.body;

    // Log pentru debugging
    console.log('Payload primit:', newProducts);

    // Validare inițială
    if (!Array.isArray(newProducts)) {
      return next(errorHandler(400, "Lista de produse noi este invalidă."));
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return next(errorHandler(404, "Oferta nu a fost găsită."));
    }

    // Verificare status
    if (!["proiect", "trimisa"].includes(offer.status)) {
      return next(errorHandler(400, "Oferta nu mai poate fi editată în statusul curent."));
    }

    // Adăugăm fallback pentru produsele existente
    offer.parts = offer.parts.map(part => {
      const partObj = part.toObject ? part.toObject() : part;
      return {
        ...partObj,
        deliveryTerm: partObj.deliveryTerm || "Necunoscut"
      };
    });

    // Validare și procesare produse noi
    const processedNewProducts = newProducts.map(product => {
      // Validare câmpuri obligatorii
      const requiredFields = ['partCode', 'partType', 'manufacturer', 'pricePerUnit', 'quantity', 'deliveryTerm'];
      const missingFields = requiredFields.filter(field => !product[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Câmpurile următoare sunt obligatorii: ${missingFields.join(', ')}`);
      }

      // Validare valori numerice
      const price = parseFloat(product.pricePerUnit);
      const quantity = parseInt(product.quantity);

      if (isNaN(price) || price <= 0) {
        throw new Error("Prețul trebuie să fie un număr pozitiv.");
      }

      if (isNaN(quantity) || quantity <= 0) {
        throw new Error("Cantitatea trebuie să fie un număr pozitiv.");
      }

      // Construire obiect produs
      return {
        partCode: product.partCode.trim(),
        partType: product.partType.trim(),
        manufacturer: product.manufacturer.trim(),
        pricePerUnit: price,
        quantity: quantity,
        deliveryTerm: product.deliveryTerm.trim() || "Necunoscut", // Fallback și aici
        total: price * quantity,
        options: [
          {
            manufacturer: product.manufacturer.trim(),
            price: price,
            description: `Opțiune de la ${product.manufacturer.trim()}`
          }
        ]
      };
    });

    // Log pentru debugging
    console.log('Produse procesate:', processedNewProducts);

    // Adăugare produse și actualizare total
    offer.parts.push(...processedNewProducts);
    
    // Recalculare total
    offer.total = offer.parts.reduce((sum, part) => sum + part.total, 0);

    // Log pentru debugging
    console.log('Oferta înainte de salvare:', {
      totalParts: offer.parts.length,
      partsWithoutDeliveryTerm: offer.parts.filter(p => !p.deliveryTerm).length,
      total: offer.total
    });

    // Salvare și răspuns
    const updatedOffer = await offer.save();

    res.status(200).json({
      success: true,
      message: "Produsele noi au fost adăugate cu succes.",
      offer: updatedOffer
    });

  } catch (error) {
    console.error('Eroare la procesarea produselor:', error);
    
    if (error.message.includes("obligatorii") || 
        error.message.includes("pozitiv") ||
        error.message.includes("Termenul de livrare")) {
      return next(errorHandler(400, error.message));
    }
    
    next(error);
  }
};