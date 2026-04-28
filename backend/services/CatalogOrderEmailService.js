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
      return process.env.SMTP_USER || 'MS_IMwfqH@test-65qngkd6wdjlwr12.mlsender.net';
    }
  }

  createTransporter() {
    const environment = process.env.NODE_ENV || 'development';

    if (environment === 'production') {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
        },
      });
    } else {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
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
	  const TVA_RATE = 0.21;
	
	  const rows = items.map((item) => {
	    const qty = Number(item.qty) || 0;
	    const pricefaraTVA = Number(item.price) || 0;
	    const tvaPerUnit = pricefaraTVA * TVA_RATE;
	    const priceCuTVA = pricefaraTVA + tvaPerUnit;
	    const totalFaraTVA = qty * pricefaraTVA;
	    const totalCuTVA = qty * priceCuTVA;
	
	    return `
	      <tr>
	        <td style="padding:8px; border:1px solid #ddd;">${item.title || "-"}</td>
	        <td style="padding:8px; border:1px solid #ddd;">${item.code || "-"}</td>
	        <td style="padding:8px; border:1px solid #ddd; text-align:center;">${qty}</td>
	        <td style="padding:8px; border:1px solid #ddd; text-align:right;">${this.formatMoney(pricefaraTVA)}</td>
	        <td style="padding:8px; border:1px solid #ddd; text-align:right;">${this.formatMoney(tvaPerUnit)}</td>
	        <td style="padding:8px; border:1px solid #ddd; text-align:right;">${this.formatMoney(priceCuTVA)}</td>
	        <td style="padding:8px; border:1px solid #ddd; text-align:right;">${this.formatMoney(totalFaraTVA)}</td>
	        <td style="padding:8px; border:1px solid #ddd; text-align:right;">${this.formatMoney(totalCuTVA)}</td>
	      </tr>
	    `;
	  }).join("");
	
	  // Calcul totale generale
	  const totalFaraTVA = items.reduce((sum, item) => {
	    return sum + (Number(item.qty) || 0) * (Number(item.price) || 0);
	  }, 0);
	  const totalTVA = totalFaraTVA * TVA_RATE;
	  const totalCuTVA = totalFaraTVA + totalTVA;
	
	  return `
	    <table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:13px;">
	      <thead>
	        <tr style="background:#f5f5f5;">
	          <th style="padding:8px; border:1px solid #ddd; text-align:left;">Produs</th>
	          <th style="padding:8px; border:1px solid #ddd; text-align:left;">Cod</th>
	          <th style="padding:8px; border:1px solid #ddd; text-align:center;">Cant.</th>
	          <th style="padding:8px; border:1px solid #ddd; text-align:right;">Preț fără TVA</th>
	          <th style="padding:8px; border:1px solid #ddd; text-align:right;">TVA (21%)</th>
	          <th style="padding:8px; border:1px solid #ddd; text-align:right;">Preț cu TVA</th>
	          <th style="padding:8px; border:1px solid #ddd; text-align:right;">Total fără TVA</th>
	          <th style="padding:8px; border:1px solid #ddd; text-align:right;">Total cu TVA</th>
	        </tr>
	      </thead>
	      <tbody>${rows}</tbody>
	      <tfoot>
	        <tr style="background:#f9f9f9; font-weight:bold;">
	          <td colspan="6" style="padding:8px; border:1px solid #ddd; text-align:right;">TOTAL:</td>
	          <td style="padding:8px; border:1px solid #ddd; text-align:right;">${this.formatMoney(totalFaraTVA)}</td>
	          <td style="padding:8px; border:1px solid #ddd; text-align:right;">${this.formatMoney(totalCuTVA)}</td>
	        </tr>
	        <tr style="background:#fff3cd;">
	          <td colspan="7" style="padding:8px; border:1px solid #ddd; text-align:right;">Din care TVA (21%):</td>
	          <td style="padding:8px; border:1px solid #ddd; text-align:right;">${this.formatMoney(totalTVA)}</td>
	        </tr>
	      </tfoot>
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

    const baseUrl = process.env.FRONTEND_URL || "https://pieseautoamerica.ro";
    const orderLink = `${baseUrl}/my-orders-catalog/${order._id}`;

    const transporter = this.createTransporter();
    const fromEmail = this.getFromEmail();

    const html = catalogOrderEmailTemplates.newOrderToCustomer(order, {
      formatMoney: this.formatMoney.bind(this),
      formatAddress: this.formatAddress.bind(this),
      buildItemsTable: this.buildItemsTable.bind(this),
      orderLink,
    });

    await transporter.sendMail({
      from: fromEmail,
      to: order.email,
      subject: `Confirmare comandă ${order.orderNumber}`,
      text: `Comanda ta ${order.orderNumber} a fost înregistrată cu succes.`,
      html,
    });

    return { success: true, sentTo: order.email };
  }

  async sendNewOrderToAdmin(order) {
    const baseUrl = process.env.FRONTEND_URL || "https://pieseautoamerica.ro";
    const orderLink = `${baseUrl}/admin/catalog-orders/${order._id}`;

    const transporter = this.createTransporter();
    const fromEmail = this.getFromEmail();

    const html = catalogOrderEmailTemplates.newOrderToAdmin(order, {
      formatMoney: this.formatMoney.bind(this),
      formatAddress: this.formatAddress.bind(this),   // ← asta lipsea
      buildItemsTable: this.buildItemsTable.bind(this),
      getCustomerName: this.getCustomerName.bind(this),
      orderLink,
    });

    await transporter.sendMail({
      from: fromEmail,
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

    const baseUrl = process.env.FRONTEND_URL || "https://pieseautoamerica.ro";
    const orderLink = `${baseUrl}/my-orders-catalog/${order._id}`;

    const transporter = this.createTransporter();
    const fromEmail = this.getFromEmail();
    const statusLabel = this.getStatusLabel(order.status);

    const html = catalogOrderEmailTemplates.statusUpdateToCustomer(order, statusLabel, { orderLink });

    await transporter.sendMail({
      from: fromEmail,
      to: order.email,
      subject: `Status comandă actualizat - ${order.orderNumber}`,
      text: `Comanda ${order.orderNumber} este acum ${statusLabel}.`,
      html,
    });

    return { success: true, sentTo: order.email };
  }
}