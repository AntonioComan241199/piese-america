import { OrderService } from "../services/orderService.js";
import { NotificationService } from "../services/notificationService.js";
import { EmailService } from "../services/emailService.js";
import { OrderValidator } from "../validators/orderValidator.js";
import { FileExportUtil } from "../utils/fileExport.js";
import { UnauthorizedError, ValidationError } from "../utils/errors.js";

let emailService = null;

function getEmailService() {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
}

/**
 * Creează o cerere de ofertă nouă
 */
export const createOrder = async (req, res, next) => {
  try {
    // Validare date de intrare
    OrderValidator.validateCreateOrder(req.body);

    // Crearea comenzii
    const order = await OrderService.createOrder(req.body, req.user.id);

    // Crearea notificării pentru admini
    await NotificationService.createNewOrderNotification(order);

    res.status(201).json({ 
      success: true, 
      message: "Cererea de ofertă a fost creată cu succes!", 
      order 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obține toate comenzile cu filtrare și paginare (pentru admini)
 */
export const getAllOrders = async (req, res, next) => {
  try {
    OrderValidator.validatePagination(req.query);
    
    const filters = OrderService.buildFilters(req.query);
    const result = await OrderService.getOrdersWithPagination(filters, req.query);

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obține comenzile utilizatorului curent
 */
export const getUserOrders = async (req, res, next) => {
  try {
    OrderValidator.validatePagination(req.query);
    
    const queryWithUserId = { ...req.query, userId: req.user.id };
    const filters = OrderService.buildFilters(queryWithUserId);
    const result = await OrderService.getOrdersWithPagination(filters, req.query);

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obține detaliile unei comenzi specifice
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await OrderService.findOrderById(req.params.id);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizează statusul unei comenzi
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await OrderService.updateOrderStatus(req.params.id, status);

    // Creează notificare pentru utilizator
    await NotificationService.createStatusUpdateNotification(
      order.userId, 
      order.orderNumber, 
      status
    );

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * Adaugă un comentariu la o cerere de ofertă
 */
export const addCommentToOrder = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Autentificare necesară.");
    }

    const { text } = req.body;
    OrderValidator.validateComment(text);

    const comments = await OrderService.addComment(req.params.id, text, req.user);
    
    res.status(200).json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

/**
 * Șterge o cerere de ofertă
 */
export const deleteOrder = async (req, res, next) => {
  try {
    await OrderService.deleteOrder(req.params.id);
    res.status(200).json({ 
      success: true, 
      message: "Cererea de ofertă a fost ștearsă cu succes." 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Exportă comenzile în format CSV
 */
export const exportOrders = async (req, res, next) => {
  try {
    const { format = "csv" } = req.query;

    if (format !== "csv") {
      throw new ValidationError("Formatul de export nu este suportat.");
    }

    const csvContent = await OrderService.exportOrders();
    const filePath = await FileExportUtil.writeCsvFile(csvContent, "orders");

    // Trimite fișierul și apoi îl șterge
    res.download(filePath, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Cleanup fișier după descărcare
      FileExportUtil.deleteFile(filePath);
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trimite email pentru o cerere nouă
 */
export const sendOrderEmail = async (req, res, next) => {
  try {
    const { orderLink, orderNumber } = req.body;

    if (!orderLink || !orderNumber) {
      throw new ValidationError("Link-ul sau numărul comenzii nu sunt furnizate.");
    }

    await getEmailService().sendNewOrderEmail(orderLink, orderNumber);
    
    res.status(200).json({ 
      success: true, 
      message: "Email-ul cu link-ul cererii a fost trimis cu succes." 
    });
  } catch (error) {
    console.error("Eroare la trimiterea email-ului:", error);
    next(error);
  }
};