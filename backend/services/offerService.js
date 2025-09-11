import Offer from "../models/Offer.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";
import { ValidationError, NotFoundError, ConflictError } from "../utils/errors.js";

export class OfferService {
  /**
   * Validează piesele pentru o ofertă
   */
  static validateOfferParts(parts) {
    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      throw new ValidationError("Lista de piese este invalidă sau goală.");
    }

    for (const part of parts) {
      if (
        typeof part.pricePerUnit !== "number" ||
        typeof part.quantity !== "number" ||
        part.pricePerUnit <= 0 ||
        part.quantity <= 0
      ) {
        throw new ValidationError("Prețul per unitate și cantitatea trebuie să fie valori numerice pozitive.");
      }
    }
  }

  /**
   * Procesează piesele pentru o ofertă (adaugă opțiuni și calculează totaluri)
   */
  static processOfferParts(parts) {
    return parts.map(part => ({
      ...part,
      options: [{
        manufacturer: part.manufacturer,
        price: part.pricePerUnit,
        description: `Alternativa oferită de ${part.manufacturer}`,
      }],
      total: part.pricePerUnit * part.quantity
    }));
  }

  /**
   * Creează o ofertă nouă cu tranzacție
   */
  static async createOffer(orderId, parts, options = {}) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new ValidationError("ID-ul cererii este invalid.");
    }

    this.validateOfferParts(parts);
    const processedParts = this.processOfferParts(parts);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        throw new NotFoundError("Cererea de ofertă nu a fost găsită.");
      }

      if (order.offerId) {
        throw new ConflictError("Această cerere are deja o ofertă asociată.");
      }

      const newOffer = new Offer({
        offerNumber: order.orderNumber,
        orderId: order._id,
        parts: processedParts,
        total: processedParts.reduce((sum, part) => sum + part.total, 0),
        ...options
      });

      const savedOffer = await newOffer.save({ session });

      order.offerId = savedOffer._id;
      order.status = "ofertat";
      await order.save({ session });

      await session.commitTransaction();
      return savedOffer;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Construiește filtrul pentru căutarea ofertelor
   */
  static buildOfferFilters(queryParams, userOrders = null) {
    const {
      status,
      offerNumber,
      startDate,
      endDate,
      selectedDate,
      phoneNumber,
      partCode
    } = queryParams;

    const filters = {};

    // Filtrare după status
    if (status) {
      const validStatuses = [
        "proiect", "trimisa", "oferta_acceptata",
        "livrare_in_procesare", "livrata", "anulata"
      ];
      if (!validStatuses.includes(status)) {
        throw new ValidationError("Status invalid.");
      }
      filters.status = status;
    }

    // Filtrare după numărul ofertei
    if (offerNumber) {
      if (isNaN(Number(offerNumber))) {
        throw new ValidationError("Numărul ofertei trebuie să fie numeric.");
      }
      filters.offerNumber = Number(offerNumber);
    }

    // Filtrare pe dată
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      filters.createdAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          throw new ValidationError("Data de început este invalidă.");
        }
        dateFilter.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          throw new ValidationError("Data de sfârșit este invalidă.");
        }
        dateFilter.$lte = end;
      }
      filters.createdAt = dateFilter;
    }

    // Filtrare pentru utilizatori specifici
    if (userOrders) {
      filters.orderId = { $in: userOrders };
    }

    // Filtrare după codul piesei
    if (partCode) {
      filters["selectedParts.partCode"] = partCode;
    }

    // Filtrare după numărul de telefon
    if (phoneNumber) {
      filters["orderId.phoneNumber"] = phoneNumber;
    }

    return filters;
  }

  /**
   * Obține oferte cu paginare și filtrare
   */
  static async getOffersWithPagination(filters, { page = 1, limit = 10, sortBy = "createdAt", order = "desc" }) {
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const [offers, totalOffers] = await Promise.all([
      Offer.find(filters)
        .populate({
          path: "orderId",
          select: "phoneNumber orderNumber firstName lastName"
        })
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Offer.countDocuments(filters)
    ]);

    return {
      offers,
      pagination: {
        total: totalOffers,
        page: parseInt(page),
        pages: Math.ceil(totalOffers / limitNum),
      }
    };
  }

  /**
   * Găsește o ofertă după ID cu verificare de existență
   */
  static async findOfferById(id, populate = null) {
    let query = Offer.findById(id);
    
    if (populate) {
      if (typeof populate === 'string') {
        query = query.populate(populate);
      } else {
        query = query.populate(populate);
      }
    }

    const offer = await query;

    if (!offer) {
      throw new NotFoundError("Oferta nu a fost găsită.");
    }

    return offer;
  }

  /**
   * Găsește o ofertă după orderId
   */
  static async findOfferByOrderId(orderId) {
    const offer = await Offer.findOne({ orderId })
      .populate("orderId", "orderNumber firstName lastName")
      .populate("parts.selectedOption", "manufacturer price");

    if (!offer) {
      throw new NotFoundError("Oferta pentru această comandă nu a fost găsită.");
    }

    return offer;
  }

  /**
   * Șterge o ofertă cu tranzacție
   */
  static async deleteOffer(offerId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const offer = await Offer.findByIdAndDelete(offerId).session(session);

      if (!offer) {
        throw new NotFoundError("Oferta nu a fost găsită.");
      }

      const order = await Order.findById(offer.orderId).session(session);
      if (order) {
        order.offerId = null;
        order.status = "asteptare_oferta";
        await order.save({ session });
      }

      await session.commitTransaction();
      return offer;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Actualizează statusul unei oferte
   */
  static async updateOfferStatus(offerId, status, userId = null) {
    const validStatuses = ["proiect", "trimisa", "oferta_acceptata", "oferta_respinsa", "anulata"];
    if (!validStatuses.includes(status)) {
      throw new ValidationError("Status invalid.");
    }

    const offer = await this.findOfferById(offerId);
    offer.status = status;
    
    // Log pentru audit
    if (offer.logs && userId) {
      offer.logs.push({
        timestamp: new Date(),
        userId,
        action: "Actualizare status",
        details: `Statusul ofertei a fost actualizat la ${status}.`
      });
    }

    return await offer.save();
  }

  /**
   * Acceptă o ofertă cu tranzacție
   */
  static async acceptOffer(offerId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const offer = await Offer.findById(offerId).session(session);
      if (!offer) {
        throw new NotFoundError("Oferta nu a fost găsită.");
      }

      offer.status = "oferta_acceptata";
      await offer.save({ session });

      const order = await Order.findById(offer.orderId).session(session);
      if (order) {
        order.status = "oferta_acceptata";
        await order.save({ session });
      }

      await session.commitTransaction();
      return { offer, order };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Respinge o ofertă
   */
  static async rejectOffer(offerId, userId) {
    const offer = await this.findOfferById(offerId);
    offer.status = "anulata";
    await offer.save();

    const order = await Order.findById(offer.orderId);
    if (order) {
      order.status = "anulata";
      await order.save();
    }

    return { offer, order };
  }

  /**
   * Actualizează statusul de livrare
   */
  static async updateDeliveryStatus(offerId, deliveryStatus, userId) {
    const validStatuses = ["livrare_in_procesare", "livrata", "anulata"];
    if (!validStatuses.includes(deliveryStatus)) {
      throw new ValidationError("Statusul de livrare este invalid.");
    }

    const offer = await this.findOfferById(offerId);

    if (deliveryStatus === "livrata" && offer.status !== "livrare_in_procesare") {
      throw new ValidationError("Livrarea poate fi finalizată doar dacă este în proces.");
    }

    offer.status = deliveryStatus;
    await offer.save();

    const order = await Order.findById(offer.orderId);
    if (!order) {
      throw new NotFoundError("Cererea asociată ofertei nu a fost găsită.");
    }

    // Mapare status pentru order
    const orderStatusMap = {
      "livrata": "livrata",
      "anulata": "anulata",
      "livrare_in_procesare": "livrare_in_procesare"
    };

    order.status = orderStatusMap[deliveryStatus];
    await order.save();

    return { offer, order };
  }

  /**
   * Actualizează piesele selectate
   */
  static async updateSelectedParts(offerId, selectedParts, options = {}) {
    if (!selectedParts || !Array.isArray(selectedParts) || selectedParts.length === 0) {
      throw new ValidationError("Lista de piese selectate este invalidă sau goală.");
    }

    const offer = await this.findOfferById(offerId);

    if (!["proiect", "trimisa"].includes(offer.status)) {
      throw new ValidationError("Selecțiile nu pot fi modificate după ce oferta este în proces de finalizare.");
    }

    const updatedSelectedParts = [];
    let updatedTotal = 0;

    // Procesare piese selectate
    offer.parts.forEach((part) => {
      const selectedPart = selectedParts.find(
        (p) => String(p.selectedOption) === String(part.options[0]?._id)
      );

      if (selectedPart) {
        const selectedOption = part.options.find(
          (opt) => String(opt._id) === String(selectedPart.selectedOption)
        );

        if (selectedOption) {
          const partTotal = selectedOption.price * selectedPart.quantity;
          updatedTotal += partTotal;

          updatedSelectedParts.push({
            partCode: part.partCode,
            partType: part.partType,
            manufacturer: part.manufacturer,
            pricePerUnit: selectedOption.price,
            quantity: selectedPart.quantity,
            total: partTotal,
            selectedOption: selectedOption._id,
          });
        }
      }
    });

    if (updatedSelectedParts.length === 0) {
      throw new ValidationError("Selecțiile pieselor nu corespund pieselor disponibile.");
    }

    // Actualizează cantitățile și în array-ul parts pentru produsele selectate
    offer.parts.forEach((part) => {
      const selectedPart = selectedParts.find(
        (p) => String(p.selectedOption) === String(part.options[0]?._id)
      );

      if (selectedPart) {
        // Actualizează cantitatea și totalul în array-ul parts
        part.quantity = selectedPart.quantity;
        part.total = part.pricePerUnit * selectedPart.quantity;
      }
    });

    // Actualizare ofertă
    offer.selectedParts = updatedSelectedParts;
    offer.total = updatedTotal;
    
    if (options.billingAddress) offer.billingAddress = options.billingAddress;
    if (options.deliveryAddress) offer.deliveryAddress = options.deliveryAddress;
    if (typeof options.pickupAtCentral === 'boolean') {
      offer.pickupAtCentral = options.pickupAtCentral;
      if (options.pickupAtCentral) offer.deliveryAddress = null;
    }

    return await offer.save();
  }

  /**
   * Exportă oferte în format CSV
   */
  static async exportOffers() {
    const offers = await Offer.find().populate("orderId", "orderNumber");

    const csvData = offers.map((offer) =>
      [
        offer.offerNumber,
        offer.orderId?.orderNumber || 'N/A',
        offer.total,
        offer.status,
        offer.createdAt.toISOString(),
      ].join(",")
    );

    csvData.unshift("OfferNumber,OrderNumber,Total,Status,CreatedAt");
    return csvData.join("\n");
  }

  /**
   * Obține statistici oferte
   */
  static async getOfferStats() {
    return await Offer.aggregate([
      { $group: { _id: { $month: "$createdAt" }, total: { $sum: "$total" }, count: { $sum: 1 } } },
      { $sort: { "_id": 1 } },
    ]);
  }

  /**
   * Actualizează cantitățile pieselor
   */
  static async updateQuantities(offerId, quantities) {
    const offer = await this.findOfferById(offerId);

    if (offer.status !== "proiect") {
      throw new ValidationError("Cantitățile pot fi actualizate doar pentru oferte în stadiul de proiect.");
    }

    offer.parts.forEach((part) => {
      if (quantities[part.partCode]) {
        const newQuantity = parseInt(quantities[part.partCode]);
        if (isNaN(newQuantity) || newQuantity <= 0) {
          throw new ValidationError(`Cantitatea pentru ${part.partCode} trebuie să fie un număr pozitiv.`);
        }
        part.quantity = newQuantity;
        part.total = part.pricePerUnit * part.quantity;
      }
    });

    offer.total = offer.parts.reduce((sum, part) => sum + part.total, 0);
    return await offer.save();
  }

  /**
   * Actualizează o ofertă existentă
   */
  static async updateOffer(offerId, updateData) {
    const offer = await this.findOfferById(offerId);

    // Validez că oferta poate fi actualizată
    if (offer.status === 'finalizat') {
      throw new ValidationError("Oferta finalizată nu poate fi modificată.");
    }

    // Actualizează doar câmpurile permise
    const allowedFields = ['parts', 'deliveryTerms', 'validityDays', 'notes'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        offer[field] = updateData[field];
      }
    });

    // Recalculez totalul dacă s-au modificat piesele
    if (updateData.parts) {
      offer.total = offer.parts.reduce((sum, part) => sum + (part.pricePerUnit * part.quantity), 0);
    }

    return await offer.save();
  }

  /**
   * Actualizează produsele unei oferte
   */
  static async updateOfferProducts(offerId, products) {
    const offer = await this.findOfferById(offerId);

    if (offer.status === 'finalizat') {
      throw new ValidationError("Produsele unei oferte finalizate nu pot fi modificate.");
    }

    // Validez produsele
    if (!Array.isArray(products) || products.length === 0) {
      throw new ValidationError("Lista de produse este obligatorie și nu poate fi goală.");
    }

    // Înlocuiesc toate produsele
    offer.parts = products.map(product => ({
      partName: product.partName,
      partCode: product.partCode || `PART-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quantity: product.quantity || 1,
      pricePerUnit: product.pricePerUnit || 0,
      total: (product.quantity || 1) * (product.pricePerUnit || 0),
      supplier: product.supplier || 'Standard',
      deliveryDays: product.deliveryDays || 7,
      warranty: product.warranty || '12 luni',
      notes: product.notes || ''
    }));

    // Recalculez totalul
    offer.total = offer.parts.reduce((sum, part) => sum + part.total, 0);

    return await offer.save();
  }

  /**
   * Adaugă produse noi la o ofertă existentă
   */
  static async addOfferProducts(offerId, products) {
    const offer = await this.findOfferById(offerId);

    if (offer.status === 'finalizat') {
      throw new ValidationError("Nu se pot adăuga produse la o ofertă finalizată.");
    }

    // Validez produsele
    if (!Array.isArray(products) || products.length === 0) {
      throw new ValidationError("Lista de produse este obligatorie și nu poate fi goală.");
    }

    // Adaug produsele noi
    const newProducts = products.map(product => ({
      partName: product.partName,
      partCode: product.partCode || `PART-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quantity: product.quantity || 1,
      pricePerUnit: product.pricePerUnit || 0,
      total: (product.quantity || 1) * (product.pricePerUnit || 0),
      supplier: product.supplier || 'Standard',
      deliveryDays: product.deliveryDays || 7,
      warranty: product.warranty || '12 luni',
      notes: product.notes || ''
    }));

    offer.parts.push(...newProducts);

    // Recalculez totalul
    offer.total = offer.parts.reduce((sum, part) => sum + part.total, 0);

    return await offer.save();
  }
}