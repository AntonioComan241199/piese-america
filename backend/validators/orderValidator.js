import { ValidationError } from "../utils/errors.js";

export class OrderValidator {
  /**
   * Validează datele pentru crearea unei comenzi
   */
  static validateCreateOrder(orderData) {
    const errors = [];
    
    // Validări comune
    if (!orderData.email || !this.isValidEmail(orderData.email)) {
      errors.push("Email valid este obligatoriu.");
    }
    
    if (!orderData.phoneNumber || !this.isValidPhoneNumber(orderData.phoneNumber)) {
      errors.push("Număr de telefon valid este obligatoriu.");
    }
    
    if (!orderData.carMake?.trim()) {
      errors.push("Marca mașinii este obligatorie.");
    }
    
    if (!orderData.carModel?.trim()) {
      errors.push("Modelul mașinii este obligatoriu.");
    }
    
    if (!orderData.carYear || !this.isValidYear(orderData.carYear)) {
      errors.push("An valid al mașinii este obligatoriu.");
    }
    
    if (!orderData.partDetails?.trim()) {
      errors.push("Detaliile piesei sunt obligatorii.");
    }

    // Validări specifice tipului de utilizator
    if (orderData.userType === "persoana_fizica") {
      if (!orderData.firstName?.trim()) {
        errors.push("Prenumele este obligatoriu pentru persoanele fizice.");
      }
      if (!orderData.lastName?.trim()) {
        errors.push("Numele este obligatoriu pentru persoanele fizice.");
      }
    } else if (orderData.userType === "persoana_juridica") {
      if (!orderData.companyDetails?.companyName?.trim()) {
        errors.push("Numele companiei este obligatoriu pentru persoanele juridice.");
      }
      if (!orderData.companyDetails?.cui?.trim()) {
        errors.push("CUI-ul este obligatoriu pentru persoanele juridice.");
      }
      if (!orderData.companyDetails?.nrRegCom?.trim()) {
        errors.push("Numărul de registru al comerțului este obligatoriu pentru persoanele juridice.");
      }
    } else {
      errors.push("Tipul de utilizator trebuie să fie 'persoana_fizica' sau 'persoana_juridica'.");
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(" "));
    }
  }

  /**
   * Validează formatul email-ului
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validează numărul de telefon (format românesc și internațional)
   */
  static isValidPhoneNumber(phone) {
    const phoneRegex = /^(\+4|0)[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Validează anul mașinii
   */
  static isValidYear(year) {
    const currentYear = new Date().getFullYear();
    const numYear = parseInt(year);
    return numYear >= 1900 && numYear <= currentYear + 1;
  }

  /**
   * Validează parametrii de paginare
   */
  static validatePagination({ page, limit }) {
    const errors = [];
    
    if (page && (isNaN(page) || parseInt(page) < 1)) {
      errors.push("Numărul paginii trebuie să fie un număr pozitiv.");
    }
    
    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
      errors.push("Limita trebuie să fie un număr între 1 și 100.");
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(" "));
    }
  }

  /**
   * Validează textul unui comentariu
   */
  static validateComment(text) {
    if (!text?.trim()) {
      throw new ValidationError("Textul comentariului este obligatoriu.");
    }
    
    if (text.trim().length > 1000) {
      throw new ValidationError("Comentariul nu poate depăși 1000 de caractere.");
    }
  }
}