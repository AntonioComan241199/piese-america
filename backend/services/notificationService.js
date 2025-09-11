import Notification from "../models/Notification.js";

export class NotificationService {
  /**
   * Creează o notificare pentru o cerere nouă
   */
  static async createNewOrderNotification(order) {
    const displayName = order.userType === "persoana_fizica"
      ? `${order.firstName} ${order.lastName} (${order.email}, Tel: ${order.phoneNumber})`
      : `${order.companyDetails.companyName} (${order.email}, Tel: ${order.phoneNumber})`;

    return await Notification.create({
      userId: null, // Notificare generală pentru admini
      type: "cerere_noua",
      message: `O cerere de ofertă a fost creată de ${displayName}, cu număr cerere: #${order.orderNumber}.`,
    });
  }

  /**
   * Creează o notificare pentru actualizarea statusului
   */
  static async createStatusUpdateNotification(userId, orderNumber, status) {
    return await Notification.create({
      userId,
      type: "actualizare_status",
      message: `Statusul comenzii #${orderNumber} a fost actualizat la ${status}.`,
    });
  }
}