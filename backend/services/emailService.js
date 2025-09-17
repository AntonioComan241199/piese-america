import nodemailer from 'nodemailer';
import { emailTemplates } from '../templates/emailTemplates.js';

export class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
    this.fromEmail = this.getFromEmail();
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
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
        }
      });
    } else {
      // Development folosește MailerSend SMTP cu credentialele oficiale
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailersend.net',
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
   * Trimite email pentru o cerere nouă
   */
  async sendNewOrderEmail(orderLink, orderNumber) {
    // Curățăm link-ul de slash-uri duble
    const cleanedOrderLink = orderLink.replace(/([^:]\/)\/+/g, '$1');
    
    const mailOptions = {
      from: this.fromEmail,
      to: process.env.ADMIN_EMAIL || "antonio.coman99@gmail.com",
      subject: `Nouă solicitare pentru piese auto - Comanda #${orderNumber}`,
      text: `Salut! Un client a trimis o solicitare de ofertă. Poți vizualiza cererea completă accesând link-ul: ${cleanedOrderLink}. Detalii suplimentare sunt disponibile în aplicație.`,
      html: emailTemplates.newOrderEmail(cleanedOrderLink, orderNumber),
    };

    return await this.transporter.sendMail(mailOptions);
  }

  /**
   * Trimite email generic
   */
  async sendEmail({ to, subject, text, html }) {
    const mailOptions = {
      from: this.fromEmail,
      to,
      subject,
      text,
      html,
    };

    return await this.transporter.sendMail(mailOptions);
  }
}