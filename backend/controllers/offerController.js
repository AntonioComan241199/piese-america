import { OfferService } from "../services/offerService.js";
import { OfferEmailService } from "../services/offerEmailService.js";
import { NotificationService } from "../services/notificationService.js";
import { OfferValidator } from "../validators/offerValidator.js";
import { FileExportUtil } from "../utils/fileExport.js";
import { createLog } from "../utils/createLog.js";
import { UnauthorizedError, ValidationError } from "../utils/errors.js";
import Order from "../models/Order.js";
import PDFDocument from "pdfkit";

let offerEmailService = null;

function getOfferEmailService() {
  if (!offerEmailService) {
    offerEmailService = new OfferEmailService();
  }
  return offerEmailService;
}

/**
 * Creează o ofertă nouă
 */
export const createOffer = async (req, res, next) => {
  try {
    OfferValidator.validateCreateOffer(req.body);
    
    const { orderId, parts } = req.body;
    const offer = await OfferService.createOffer(orderId, parts);

    // Obține ordinul pentru notificare
    const order = await Order.findById(orderId);
    if (order) {
      await NotificationService.createNewOrderNotification(order);
    }

    res.status(201).json({
      success: true,
      message: "Oferta a fost creată cu succes.",
      offer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obține toate ofertele cu filtrare și paginare (pentru admini)
 */
export const getAllOffers = async (req, res, next) => {
  try {
    OfferValidator.validatePagination(req.query);
    OfferValidator.validateSortParams(req.query);
    
    const filters = OfferService.buildOfferFilters(req.query);
    const result = await OfferService.getOffersWithPagination(filters, req.query);

    res.status(200).json({
      success: true,
      data: result.offers,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obține ofertele utilizatorului curent
 */
export const getUserOffers = async (req, res, next) => {
  try {
    OfferValidator.validatePagination(req.query);
    
    // Găsește comenzile utilizatorului
    const userOrders = await Order.find({ userId: req.user.id }, "_id");
    const orderIds = userOrders.map(order => order._id);
    
    const filters = OfferService.buildOfferFilters(req.query, orderIds);
    const result = await OfferService.getOffersWithPagination(filters, req.query);

    res.status(200).json({
      success: true,
      data: result.offers,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obține o ofertă specifică după ID
 */
export const getOfferById = async (req, res, next) => {
  try {
    const populate = {
      path: "orderId",
      select: "orderNumber userId userType firstName lastName companyDetails email phoneNumber carMake carModel carYear fuelType enginePower engineSize transmission vin partDetails status",
      populate: {
        path: "userId",
        select: "email firstName lastName"
      }
    };
    
    const offer = await OfferService.findOfferById(req.params.offerId, populate);
    
    res.status(200).json({ success: true, offer });
  } catch (error) {
    next(error);
  }
};

/**
 * Obține oferta pentru o comandă specifică
 */
export const getOfferByOrderId = async (req, res, next) => {
  try {
    const offer = await OfferService.findOfferByOrderId(req.params.orderId);
    res.status(200).json({ success: true, offer });
  } catch (error) {
    next(error);
  }
};

/**
 * Șterge o ofertă
 */
export const deleteOffer = async (req, res, next) => {
  try {
    await OfferService.deleteOffer(req.params.offerId);
    res.status(200).json({ 
      success: true, 
      message: "Oferta a fost ștearsă cu succes." 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizează statusul unei oferte
 */
export const updateOfferStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    OfferValidator.validateOfferStatus(status);
    
    const offer = await OfferService.updateOfferStatus(
      req.params.offerId, 
      status, 
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: `Statusul ofertei a fost actualizat la ${status}.`,
      offer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Acceptă o ofertă
 */
export const acceptOffer = async (req, res, next) => {
  try {
    const { offer, order } = await OfferService.acceptOffer(req.params.offerId, req.user.id);

    // Creează log pentru audit
    await createLog({
      action: "Oferta acceptată",
      userId: req.user.id,
      orderId: offer.orderId,
      details: `Oferta cu numărul #${offer.offerNumber} a fost acceptată.`,
    });

    res.status(200).json({
      success: true,
      message: "Oferta a fost acceptată cu succes.",
      offer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Respinge o ofertă
 */
export const rejectOffer = async (req, res, next) => {
  try {
    const { offer, order } = await OfferService.rejectOffer(req.params.offerId, req.user.id);

    // Creează log pentru audit
    await createLog({
      action: "Oferta anulată",
      userId: req.user.id,
      orderId: offer.orderId,
      details: `Oferta cu numărul #${offer.offerNumber} a fost anulată.`,
    });

    res.status(200).json({ 
      success: true, 
      message: "Oferta a fost anulată cu succes.", 
      offer 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizează statusul de livrare
 */
export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { deliveryStatus } = req.body;
    OfferValidator.validateDeliveryStatus(deliveryStatus);

    const { offer, order } = await OfferService.updateDeliveryStatus(
      req.params.offerId,
      deliveryStatus,
      req.user.id
    );

    // Creează log pentru audit
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

/**
 * Selectează opțiunile pentru piese
 */
export const selectOptions = async (req, res, next) => {
  try {
    const { selectedParts } = req.body;
    OfferValidator.validateSelectedParts(selectedParts);
    
    const offer = await OfferService.updateSelectedParts(req.params.offerId, selectedParts);

    res.status(200).json({
      success: true,
      message: "Piesele selectate au fost salvate cu succes.",
      offer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizează piesele selectate cu adrese
 */
export const updateSelectedParts = async (req, res, next) => {
  try {
    const { selectedParts, billingAddress, deliveryAddress, pickupAtCentral } = req.body;
    
    OfferValidator.validateSelectedParts(selectedParts);
    OfferValidator.validateBillingAddress(billingAddress);
    OfferValidator.validateDeliveryAddress(deliveryAddress, pickupAtCentral);

    const options = { billingAddress, deliveryAddress, pickupAtCentral };
    const offer = await OfferService.updateSelectedParts(req.params.offerId, selectedParts, options);

    res.status(200).json({
      success: true,
      message: "Piesele selectate și adresele au fost actualizate cu succes.",
      offer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Finalizează o ofertă
 */
export const finalizeOffer = async (req, res, next) => {
  try {
    const { billingAddress, deliveryAddress, pickupAtCentral, selectedParts } = req.body;
    
    OfferValidator.validateSelectedParts(selectedParts);
    OfferValidator.validateBillingAddress(billingAddress);
    OfferValidator.validateDeliveryAddress(deliveryAddress, pickupAtCentral);

    const options = { billingAddress, deliveryAddress, pickupAtCentral };
    const offer = await OfferService.updateSelectedParts(req.params.offerId, selectedParts, options);

    res.status(200).json({
      success: true,
      message: "Oferta a fost finalizată cu succes.",
      offer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizează cantitățile pieselor
 */
export const updateQuantities = async (req, res, next) => {
  try {
    const { quantities } = req.body;
    OfferValidator.validateQuantities(quantities);
    
    const offer = await OfferService.updateQuantities(req.params.offerId, quantities);

    res.status(200).json({ 
      success: true, 
      message: "Cantitățile au fost actualizate.", 
      offer 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Exportă ofertele
 */
export const exportOffers = async (req, res, next) => {
  try {
    const { format = "csv" } = req.query;

    if (format === "csv") {
      const csvContent = await OfferService.exportOffers();
      const filePath = await FileExportUtil.writeCsvFile(csvContent, "offers");

      res.download(filePath, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
        }
        FileExportUtil.deleteFile(filePath);
      });
    } else if (format === "pdf") {
      const offers = await OfferService.exportOffers();
      const doc = new PDFDocument();
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=offers.pdf");
      
      doc.pipe(res);
      doc.fontSize(16).text("Raport Oferte", { align: "center" });
      doc.moveDown();
      
      const parsedOffers = offers.split('\n').slice(1); // Skip header
      parsedOffers.forEach((offerLine, index) => {
        if (offerLine.trim()) {
          const [offerNumber, orderNumber, total, status, createdAt] = offerLine.split(',');
          doc.fontSize(12)
            .text(`${index + 1}. Oferta #${offerNumber}, Comandă: ${orderNumber}, Total: ${total} RON, Status: ${status}`, 
            { lineGap: 10 });
        }
      });
      
      doc.end();
    } else {
      throw new ValidationError("Format de export invalid. Formate acceptate: csv, pdf");
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Obține statistici pentru oferte
 */
export const getOfferStats = async (req, res, next) => {
  try {
    const stats = await OfferService.getOfferStats();
    res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Trimite email cu oferta către client
 */
export const sendOfferEmail = async (req, res, next) => {
  try {
    const { offerNumber } = req.body;
    OfferValidator.validateOfferNumber(offerNumber);

    const result = await getOfferEmailService().sendOfferToClient(offerNumber);
    
    res.status(200).json({ 
      success: true, 
      message: "Email-ul cu link-ul ofertei a fost trimis cu succes.",
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trimite email de acceptare către admin
 */
export const acceptOfferEmail = async (req, res, next) => {
  try {
    const { offerNumber } = req.body;
    OfferValidator.validateOfferNumber(offerNumber);

    const result = await getOfferEmailService().sendAcceptanceEmailToAdmin(offerNumber);
    
    res.status(200).json({ 
      success: true, 
      message: "Email-ul de acceptare a fost trimis administratorului cu succes.",
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trimite email de respingere către admin
 */
export const rejectOfferEmail = async (req, res, next) => {
  try {
    const { offerNumber } = req.body;
    OfferValidator.validateOfferNumber(offerNumber);

    const result = await getOfferEmailService().sendRejectionEmailToAdmin(offerNumber);
    
    res.status(200).json({ 
      success: true, 
      message: "Email-ul de respingere a fost trimis administratorului cu succes.",
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizează o ofertă existentă (pentru admini)
 */
export const updateOffer = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    OfferValidator.validateOfferId(offerId);
    OfferValidator.validateUpdateOffer(req.body);

    const updatedOffer = await OfferService.updateOffer(offerId, req.body);

    res.status(200).json({
      success: true,
      message: "Oferta a fost actualizată cu succes.",
      offer: updatedOffer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizează produsele unei oferte (pentru admini)
 */
export const updateOfferProducts = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const { products } = req.body;

    OfferValidator.validateOfferId(offerId);
    OfferValidator.validateProducts(products);

    const updatedOffer = await OfferService.updateOfferProducts(offerId, products);

    res.status(200).json({
      success: true,
      message: "Produsele ofertei au fost actualizate cu succes.",
      offer: updatedOffer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Adaugă produse noi într-o ofertă (pentru admini)
 */
export const addOfferProducts = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const { products } = req.body;

    OfferValidator.validateOfferId(offerId);
    OfferValidator.validateProducts(products);

    const updatedOffer = await OfferService.addOfferProducts(offerId, products);

    res.status(200).json({
      success: true,
      message: "Produsele au fost adăugate la ofertă cu succes.",
      offer: updatedOffer
    });
  } catch (error) {
    next(error);
  }
};