import nodemailer from "nodemailer";
import { catalogOrderEmailTemplates } from "../templates/catalogOrderEmailTemplates.js";
import { ValidationError } from "../utils/errors.js";

export class CatalogOrderEmailService {
  constructor() {
    this.transporter = this.createTransporter();
    this.fromEmail = this.getFromEmail();
    this.adminEmail = process.env.ADMIN_EMAIL || "antonio.coman99@gmail.com";
  }

  getFromEmail() {
    const environment = process.env.NODE_ENV || "development";

    if (environment === "production") {
      return process.env.FROM_EMAIL || "noreply@pieseautoamerica.ro";
    } else {
      return process.env.SMTP_USER || "test@example.com";
    }
  }

  createTransporter() {
    const environment = process.env.NODE_ENV || "development";

    if (environment === "production") {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
        },
      });
    } else {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  formatMoney(value) {
    const amount = Number(value) || 0;
    return `${amount.toFixed(2)} RON`;
  }

  formatAddress(address) {
    if (!address) return "N/A";

    const line1 = [address.street, address.number ? `Nr. ${address.number}` : null]
      .filter(Boolean)
      .join(", ");

    const line2 = [
      address.block ? `Bloc ${address.block}` : null,
      address.entrance ? `Scara ${address.entrance}` : null,
      address.apartment ? `Ap. ${address.apartment}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const line3 = [address.city, address.county].filter(Boolean).join(", ");

    return [line1, line2, line3].filter(Boolean).join(", ") || "N/A";
  }

  buildItemsTable(items = []) {
    const rows = items.map((item) => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      const total = qty * price;

      return `
        <tr>
          <td style="padding:8px; border:1px solid #ddd;">${item.title || "-"}</td>
          <td style="padding:8px; border:1px solid #ddd;">${item.code || "-"}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:center;">${qty}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:right;">${this.formatMoney(price)}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:right;">${this.formatMoney(total)}</td>
        </tr>
      `;
    }).join("");

    return `
      <table style="width:100%; border-collapse:collapse; margin-top:10px;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Produs</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Cod</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:center;">Cantitate</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:right;">Preț</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  getCustomerName(order) {
    if (order.userType === "persoana_juridica") {
      return order.companyDetails?.companyName || "Companie necunoscută";
    }

    return `${order.firstName || ""} ${order.lastName || ""}`.trim() || "Client necunoscut";
  }

  getStatusLabel(status) {
    const labels = {
      in_asteptare: "În așteptare",
      pregatita: "Pregătită",
      livrata: "Livrată",
      anulata: "Anulată",
    };

    return labels[status] || status;
  }

  async sendNewOrderToCustomer(order) {
    if (!order?.email) {
      throw new ValidationError("Comanda nu are email pentru client.");
    }

    const html = catalogOrderEmailTemplates.newOrderToCustomer(order, {
      formatMoney: this.formatMoney.bind(this),
      formatAddress: this.formatAddress.bind(this),
      buildItemsTable: this.buildItemsTable.bind(this),
    });

    await this.transporter.sendMail({
      from: this.fromEmail,
      to: order.email,
      subject: `Confirmare comandă ${order.orderNumber}`,
      text: `Comanda ta ${order.orderNumber} a fost înregistrată cu succes.`,
      html,
    });

    return { success: true, sentTo: order.email };
  }

  async sendNewOrderToAdmin(order) {
    const html = catalogOrderEmailTemplates.newOrderToAdmin(order, {
      formatMoney: this.formatMoney.bind(this),
      buildItemsTable: this.buildItemsTable.bind(this),
      getCustomerName: this.getCustomerName.bind(this),
    });

    await this.transporter.sendMail({
      from: this.fromEmail,
      to: this.adminEmail,
      subject: `Comandă nouă ${order.orderNumber}`,
      text: `A fost plasată comanda ${order.orderNumber}.`,
      html,
    });

    return { success: true, sentTo: this.adminEmail };
  }

  async sendOrderStatusUpdateToCustomer(order) {
    if (!order?.email) {
      throw new ValidationError("Comanda nu are email pentru client.");
    }

    const statusLabel = this.getStatusLabel(order.status);

    const html = catalogOrderEmailTemplates.statusUpdateToCustomer(order, statusLabel);

    await this.transporter.sendMail({
      from: this.fromEmail,
      to: order.email,
      subject: `Status comandă actualizat - ${order.orderNumber}`,
      text: `Comanda ${order.orderNumber} este acum ${statusLabel}.`,
      html,
    });

    return { success: true, sentTo: order.email };
  }
}