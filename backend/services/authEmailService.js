import nodemailer from "nodemailer";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import { authEmailTemplates } from "../templates/authEmailTemplates.js";
import { ValidationError } from "../utils/errors.js";

export class AuthEmailService {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.transporter = this.createTransporter();
    this.fromEmail = this.getFromEmail();
    this.baseUrl = process.env.FRONTEND_URL || "https://pieseautoamerica.ro";
    
    // Inițializează MailerSend pentru development
    if (this.environment === 'development') {
      this.mailerSend = new MailerSend({
        apiKey: process.env.MAILERSEND_API_KEY,
      });
    }
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
  createTransporter(useMailerSend = false) {
    const environment = process.env.NODE_ENV || 'development';

    if (environment === 'production') {
      // Production folosește SMTP dedicat
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
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
   * Verifică configurația email-ului
   */
  async verifyEmailConfig() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration error:', error);
      return false;
    }
  }

  /**
   * Construiește link-ul de resetare parolă
   */
  buildPasswordResetLink(token) {
    return `${this.baseUrl}/reset-password/${token}`;
  }

  /**
   * Trimite email pentru resetarea parolei
   */
  async sendPasswordResetEmail(email, token, userFirstName = '') {
    if (!email || !token) {
      throw new ValidationError("Email și token sunt obligatorii pentru resetarea parolei.");
    }

    const resetLink = this.buildPasswordResetLink(token);

    const mailOptions = {
      from: this.fromEmail,
      to: email.toLowerCase(),
      subject: "Piese Auto America - Resetare Parolă",
      text: `Ai solicitat resetarea parolei pentru contul tău. Accesează link-ul pentru a-ți reseta parola: ${resetLink}. Link-ul este valabil 1 oră.`,
      html: authEmailTemplates.passwordReset(resetLink, userFirstName),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent successfully to ${email}:`, info.messageId);
      return { 
        success: true, 
        messageId: info.messageId,
        sentTo: email 
      };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw new Error("Eroare la trimiterea email-ului de resetare a parolei.");
    }
  }

  /**
   * Trimite email de bun venit după înregistrare
   */
  async sendWelcomeEmail(email, userFirstName, userType) {
    if (!email) {
      throw new ValidationError("Email-ul este obligatoriu pentru trimiterea mesajului de bun venit.");
    }

    const mailOptions = {
      from: this.fromEmail,
      to: email.toLowerCase(),
      subject: "Bine ai venit la Piese Auto America!",
      text: `Bine ai venit, ${userFirstName}! Îți mulțumim că te-ai înregistrat pe platforma noastră.`,
      html: authEmailTemplates.welcomeEmail(userFirstName, userType),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent successfully to ${email}:`, info.messageId);
      return { 
        success: true, 
        messageId: info.messageId,
        sentTo: email 
      };
    } catch (error) {
      console.error("Error sending welcome email:", error);
      // Nu aruncăm eroare pentru email-ul de bun venit - nu e critic
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Trimite email de confirmare schimbare parolă
   */
  async sendPasswordChangedEmail(email, userFirstName = '') {
    if (!email) {
      throw new ValidationError("Email-ul este obligatoriu pentru confirmarea schimbării parolei.");
    }

    const mailOptions = {
      from: this.fromEmail,
      to: email.toLowerCase(),
      subject: "Piese Auto America - Parolă Schimbată",
      text: `Parola pentru contul tău a fost schimbată cu succes. Dacă nu ai fost tu, te rugăm să ne contactezi imediat.`,
      html: authEmailTemplates.passwordChanged(userFirstName),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Password changed email sent successfully to ${email}:`, info.messageId);
      return { 
        success: true, 
        messageId: info.messageId,
        sentTo: email 
      };
    } catch (error) {
      console.error("Error sending password changed email:", error);
      // Nu aruncăm eroare - e doar informativ
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Trimite alertă de securitate
   */
  async sendSecurityAlert(email, userFirstName, activity, metadata = {}) {
    if (!email || !activity) {
      throw new ValidationError("Email și activitatea sunt obligatorii pentru alerta de securitate.");
    }

    const { ipAddress, userAgent } = metadata;

    const mailOptions = {
      from: this.fromEmail,
      to: email.toLowerCase(),
      subject: "Piese Auto America - Alertă Securitate",
      text: `Am detectat activitate suspicioasă pe contul tău: ${activity}. Dacă nu ai fost tu, te rugăm să îți schimbi parola imediat.`,
      html: authEmailTemplates.securityAlert(userFirstName, activity, ipAddress, userAgent),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Security alert email sent successfully to ${email}:`, info.messageId);
      return { 
        success: true, 
        messageId: info.messageId,
        sentTo: email 
      };
    } catch (error) {
      console.error("Error sending security alert email:", error);
      throw new Error("Eroare la trimiterea alertei de securitate.");
    }
  }

  /**
   * Trimite email personalizat
   */
  async sendCustomEmail({ to, subject, text, html }) {
    if (!to || !subject) {
      throw new ValidationError("Email-ul destinatar și subiectul sunt obligatorii.");
    }

    const mailOptions = {
      from: this.fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Custom email sent successfully:`, info.messageId);
      return { 
        success: true, 
        messageId: info.messageId,
        sentTo: to 
      };
    } catch (error) {
      console.error("Error sending custom email:", error);
      throw new Error("Eroare la trimiterea email-ului personalizat.");
    }
  }

  /**
   * Testează conexiunea email
   */
  async testEmailConnection() {
    try {
      await this.transporter.verify();
      
      // Trimite email de test
      const testEmail = {
        from: this.fromEmail,
        to: this.fromEmail, // trimite către sine
        subject: "Test Email - Piese Auto America",
        text: "Acesta este un email de test pentru verificarea configurației SMTP.",
        html: "<p>Acesta este un email de test pentru verificarea configurației SMTP.</p>"
      };

      const info = await this.transporter.sendMail(testEmail);
      
      return { 
        success: true, 
        message: "Conexiunea email funcționează corect.",
        messageId: info.messageId 
      };
    } catch (error) {
      return { 
        success: false, 
        message: "Eroare la testarea conexiunii email.",
        error: error.message 
      };
    }
  }
}