import Order from "../models/Order.js";
import Counter from "../models/Counter.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";

export class OrderService {
  /**
   * Generează următorul număr de comandă
   */
  static async generateOrderNumber() {
    const counter = await Counter.findOneAndUpdate(
      { name: "orderNumber" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    return counter.value;
  }

  /**
   * Construiește filtrul pentru căutarea comenzilor
   */
  static buildFilters({ status, orderNumber, selectedDate, phoneNumber, userId }) {
    const filters = {};
    
    if (userId) filters.userId = userId;
    if (status) filters.status = status;
    if (orderNumber) filters.orderNumber = orderNumber;
    if (phoneNumber) {
      filters.phoneNumber = { $regex: phoneNumber, $options: "i" };
    }
    
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);
      filters.orderDate = { 
        $gte: startOfDay.toISOString(), 
        $lte: endOfDay.toISOString() 
      };
    }
    
    return filters;
  }

  /**
   * Obține comenzi cu paginare și filtrare
   */
  static async getOrdersWithPagination(filters, { page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);
    
    const [orders, totalOrders] = await Promise.all([
      Order.find(filters)
        .populate("userId", "email firstName lastName")
        .populate("offerId", "offerNumber status total")
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filters)
    ]);

    return {
      orders,
      pagination: {
        total: totalOrders,
        page: parseInt(page),
        pages: Math.ceil(totalOrders / limitNum),
      }
    };
  }

  /**
   * Creează o comandă nouă
   */
  static async createOrder(orderData, userId) {
    const orderNumber = await this.generateOrderNumber();
    
    const newOrder = new Order({
      ...orderData,
      orderNumber,
      userId,
      companyDetails: orderData.userType === "persoana_juridica" 
        ? orderData.companyDetails 
        : {}
    });

    return await newOrder.save();
  }

  /**
   * Găsește o comandă după ID cu verificare de existență
   */
  static async findOrderById(id) {
    const order = await Order.findById(id)
      .populate("userId", "email firstName lastName")
      .populate("offerId", "offerNumber parts total");

    if (!order) {
      throw new NotFoundError("Cererea de ofertă nu a fost găsită.");
    }

    return order;
  }

  /**
   * Actualizează statusul unei comenzi
   */
  static async updateOrderStatus(id, status) {
    const validStatuses = [
      "asteptare_oferta", 
      "ofertat", 
      "comanda_spre_finalizare", 
      "finalizare", 
      "livrat"
    ];

    if (!validStatuses.includes(status)) {
      throw new ValidationError("Status invalid.");
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      throw new NotFoundError("Cererea de ofertă nu a fost găsită.");
    }

    return order;
  }

  /**
   * Adaugă comentariu la o comandă
   */
  static async addComment(orderId, text, user) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError("Cererea de ofertă nu a fost găsită.");
    }

    const userName = this.getUserDisplayName(user);
    const comment = { text, user: userName };
    
    order.comments.push(comment);
    await order.save();

    return order.comments;
  }

  /**
   * Determină numele utilizatorului pentru afișare
   */
  static getUserDisplayName(user) {
    if (user.role === "admin") return "Admin";
    if (user.userType === "persoana_fizica") {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.userType === "persoana_juridica" && user.companyDetails?.companyName) {
      return user.companyDetails.companyName;
    }
    return "Client";
  }

  /**
   * Șterge o comandă
   */
  static async deleteOrder(id) {
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      throw new NotFoundError("Cererea de ofertă nu a fost găsită.");
    }
    return order;
  }

  /**
   * Exportă comenzi în format CSV
   */
  static async exportOrders() {
    const orders = await Order.find()
      .populate("userId", "email firstName lastName");

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

    csvData.unshift("OrderNumber,Name,Email,PhoneNumber,Status");
    return csvData.join("\n");
  }
}