import nodemailer from "nodemailer";
import Offer from "../models/Offer.js";
import { offerEmailTemplates } from "../templates/offerEmailTemplates.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";

export class OfferEmailService {
  constructor() {
    this.transporter = this.createTransporter();
    this.baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    this.fromEmail = this.getFromEmail();
    this.adminEmail = process.env.ADMIN_EMAIL || "antonio.coman99@gmail.com";
  }

  /**
   * Determină adresa FROM în funcție de mediu
   * Development: SendGrid cu antonio.coman99@gmail.com
   * Production: SMTP dedicat cu noreply@pieseautoamerica.ro
   */
  getFromEmail() {
    const environment = process.env.NODE_ENV || 'development';
    
    if (environment === 'production') {
      // Production folosește SMTP dedicat
      return process.env.FROM_EMAIL || 'noreply@pieseautoamerica.ro';
    } else {
      // Development folosește MailerSend SMTP user
      return process.env.SMTP_USER || 'MS_IMwfqH@test-65qngkd6wdjlwr12.mlsender.net';
    }
  }

  /**
   * Creează transporterul email bazat pe mediu
   * Development: SendGrid | Production: SMTP dedicat
   */
  createTransporter() {
    const environment = process.env.NODE_ENV || 'development';

    if (environment === 'production') {
      // Production folosește SMTP dedicat
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true pentru port 465, false pentru alte porturi
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
        }
      });
    } else {
      // Development folosește MailerSend SMTP cu credentialele oficiale
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

  /**
   * Verifică configurația email și testează conexiunea
   */
  async verifyEmailConnection() {
    try {
      await this.transporter.verify();
      const environment = process.env.NODE_ENV || 'development';
      const provider = environment === 'production' ? 'smtp' : 'sendgrid';
      return { success: true, provider, environment, fromEmail: this.fromEmail };
    } catch (error) {
      console.error('Email connection verification failed:', error.message);
      const environment = process.env.NODE_ENV || 'development';
      const provider = environment === 'production' ? 'smtp' : 'sendgrid';
      return { success: false, error: error.message, provider, environment };
    }
  }

  /**
   * Găsește o ofertă după numărul ofertei și populează datele comenzii
   */
  async findOfferByNumber(offerNumber) {
    const offer = await Offer.findOne({ offerNumber }).populate("orderId", "email");

    if (!offer || !offer.orderId) {
      throw new NotFoundError("Oferta sau comanda asociată nu a fost găsită.");
    }

    return offer;
  }

  /**
   * Construiește link-ul către ofertă
   */
  buildOfferLink(offerId) {
    return `${this.baseUrl}/offer/${offerId}`;
  }

  /**
   * Trimite email cu oferta către client
   */
  async sendOfferToClient(offerNumber) {
    if (!offerNumber) {
      throw new ValidationError("Numărul ofertei nu este furnizat.");
    }

    const offer = await this.findOfferByNumber(offerNumber);
    const clientEmail = offer.orderId.email;

    if (!clientEmail) {
      throw new ValidationError("Adresa de email nu a fost găsită în comanda asociată.");
    }

    const offerLink = this.buildOfferLink(offer._id);

    const mailOptions = {
      from: this.fromEmail,
      to: clientEmail,
      subject: `Piese Auto America - Oferta #${offerNumber} pentru comanda ta`,
      text: `Aceasta este oferta #${offerNumber} trimisă pentru comanda ta. Detalii sunt disponibile la acest link: ${offerLink}.`,
      html: offerEmailTemplates.offerToClient(offerNumber, offerLink),
    };

    await this.transporter.sendMail(mailOptions);
    return { success: true, sentTo: clientEmail };
  }

  /**
   * Trimite email de acceptare către admin
   */
  async sendAcceptanceEmailToAdmin(offerNumber) {
    if (!offerNumber) {
      throw new ValidationError("Numărul ofertei nu este furnizat.");
    }

    const offer = await this.findOfferByNumber(offerNumber);
    const offerLink = this.buildOfferLink(offer._id);

    const mailOptions = {
      from: this.fromEmail,
      to: this.adminEmail,
      subject: `Oferta #${offerNumber} a fost acceptată`,
      text: `Oferta #${offerNumber} a fost acceptată de client. Poți vizualiza oferta aici: ${offerLink}.`,
      html: offerEmailTemplates.offerAcceptanceToAdmin(offerNumber, offerLink),
    };

    await this.transporter.sendMail(mailOptions);
    return { success: true, sentTo: this.adminEmail };
  }

  /**
   * Trimite email de respingere către admin
   */
  async sendRejectionEmailToAdmin(offerNumber) {
    if (!offerNumber) {
      throw new ValidationError("Numărul ofertei nu este furnizat.");
    }

    const offer = await this.findOfferByNumber(offerNumber);
    const offerLink = this.buildOfferLink(offer._id);

    const mailOptions = {
      from: this.fromEmail,
      to: this.adminEmail,
      subject: `Oferta #${offerNumber} a fost respinsă`,
      text: `Oferta #${offerNumber} a fost respinsă de client. Poți vizualiza oferta aici: ${offerLink}.`,
      html: offerEmailTemplates.offerRejectionToAdmin(offerNumber, offerLink),
    };

    await this.transporter.sendMail(mailOptions);
    return { success: true, sentTo: this.adminEmail };
  }

  /**
   * Trimite email de actualizare status livrare
   */
  async sendDeliveryStatusUpdateEmail(offerNumber, deliveryStatus, clientEmail) {
    const statusMessages = {
      "livrare_in_procesare": "în procesare",
      "livrata": "livrată",
      "anulata": "anulată"
    };

    const statusMessage = statusMessages[deliveryStatus] || deliveryStatus;

    const mailOptions = {
      from: this.fromEmail,
      to: clientEmail,
      subject: `Actualizare status livrare - Oferta #${offerNumber}`,
      text: `Statusul livrării pentru oferta #${offerNumber} a fost actualizat la: ${statusMessage}.`,
      html: offerEmailTemplates.deliveryStatusUpdate(offerNumber, statusMessage),
    };

    await this.transporter.sendMail(mailOptions);
    return { success: true, sentTo: clientEmail };
  }

  /**
   * Trimite email generic pentru oferte
   */
  async sendCustomEmail({ to, subject, text, html }) {
    const mailOptions = {
      from: this.fromEmail,
      to,
      subject,
      text,
      html,
    };

    await this.transporter.sendMail(mailOptions);
    return { success: true, sentTo: to };
  }
}