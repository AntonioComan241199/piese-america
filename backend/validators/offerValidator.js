import { ValidationError } from "../utils/errors.js";
import mongoose from "mongoose";

export class OfferValidator {
  /**
   * Validează datele pentru crearea unei oferte
   */
  static validateCreateOffer(offerData) {
    const errors = [];

    if (!offerData.orderId) {
      errors.push("ID-ul cererii este obligatoriu.");
    } else if (!mongoose.Types.ObjectId.isValid(offerData.orderId)) {
      errors.push("ID-ul cererii este invalid.");
    }

    if (!offerData.parts || !Array.isArray(offerData.parts) || offerData.parts.length === 0) {
      errors.push("Lista de piese este obligatorie și trebuie să conțină cel puțin o piesă.");
    } else {
      offerData.parts.forEach((part, index) => {
        this.validateOfferPart(part, index, errors);
      });
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(" "));
    }
  }

  /**
   * Validează o piesă din ofertă
   */
  static validateOfferPart(part, index, errors = []) {
    const partPrefix = `Piesa ${index + 1}:`;

    if (!part.partCode?.trim()) {
      errors.push(`${partPrefix} Codul piesei este obligatoriu.`);
    }

    if (!part.partType?.trim()) {
      errors.push(`${partPrefix} Tipul piesei este obligatoriu.`);
    }

    if (!part.manufacturer?.trim()) {
      errors.push(`${partPrefix} Producătorul este obligatoriu.`);
    }

    if (typeof part.pricePerUnit !== "number" || part.pricePerUnit <= 0) {
      errors.push(`${partPrefix} Prețul per unitate trebuie să fie un număr pozitiv.`);
    }

    if (typeof part.quantity !== "number" || part.quantity <= 0 || !Number.isInteger(part.quantity)) {
      errors.push(`${partPrefix} Cantitatea trebuie să fie un număr întreg pozitiv.`);
    }

    // Verificăm prețul maxim rezonabil
    if (part.pricePerUnit > 100000) {
      errors.push(`${partPrefix} Prețul pare neobișnuit de mare. Verificați dacă este corect.`);
    }

    return errors;
  }

  /**
   * Validează piesele selectate pentru finalizarea ofertei
   */
  static validateSelectedParts(selectedParts) {
    if (!selectedParts || !Array.isArray(selectedParts) || selectedParts.length === 0) {
      throw new ValidationError("Lista de piese selectate este obligatorie.");
    }

    selectedParts.forEach((part, index) => {
      if (!part.selectedOption) {
        throw new ValidationError(`Piesa ${index + 1} nu are o opțiune selectată.`);
      }

      if (!mongoose.Types.ObjectId.isValid(part.selectedOption)) {
        throw new ValidationError(`Opțiunea selectată pentru piesa ${index + 1} este invalidă.`);
      }
    });
  }

  /**
   * Validează cantitățile pentru actualizare
   */
  static validateQuantities(quantities) {
    if (!quantities || typeof quantities !== 'object') {
      throw new ValidationError("Obiectul cantități este invalid.");
    }

    const errors = [];
    
    Object.entries(quantities).forEach(([partCode, quantity]) => {
      if (!partCode?.trim()) {
        errors.push("Codul piesei nu poate fi gol.");
      }

      const numQuantity = parseInt(quantity);
      if (isNaN(numQuantity) || numQuantity <= 0) {
        errors.push(`Cantitatea pentru ${partCode} trebuie să fie un număr întreg pozitiv.`);
      }

      if (numQuantity > 1000) {
        errors.push(`Cantitatea pentru ${partCode} pare neobișnuit de mare.`);
      }
    });

    if (errors.length > 0) {
      throw new ValidationError(errors.join(" "));
    }
  }

  /**
   * Validează statusurile ofertei
   */
  static validateOfferStatus(status) {
    const validStatuses = [
      "proiect", 
      "trimisa", 
      "oferta_acceptata", 
      "oferta_respinsa", 
      "livrare_in_procesare", 
      "livrata", 
      "anulata"
    ];

    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Status invalid. Statusurile valide sunt: ${validStatuses.join(', ')}.`);
    }
  }

  /**
   * Validează statusurile de livrare
   */
  static validateDeliveryStatus(status) {
    const validStatuses = ["livrare_in_procesare", "livrata", "anulata"];

    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Status de livrare invalid. Statusurile valide sunt: ${validStatuses.join(', ')}.`);
    }
  }

  /**
   * Validează adresa de facturare
   */
  static validateBillingAddress(address) {
    if (!address) return;

    const errors = [];
    const requiredFields = ['street', 'number', 'city', 'county'];

    requiredFields.forEach(field => {
      if (!address[field]?.trim()) {
        errors.push(`${field} este obligatoriu pentru adresa de facturare.`);
      }
    });

    if (errors.length > 0) {
      throw new ValidationError(errors.join(" "));
    }
  }

  /**
   * Validează adresa de livrare
   */
  static validateDeliveryAddress(address, pickupAtCentral) {
    if (pickupAtCentral) {
      return; // Nu avem nevoie de adresă de livrare dacă se ridică de la centru
    }

    if (!address) {
      throw new ValidationError("Adresa de livrare este obligatorie dacă nu se ridică de la centru.");
    }

    this.validateBillingAddress(address); // Aceleași validări ca pentru adresa de facturare
  }

  /**
   * Validează parametrii de paginare pentru oferte
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
   * Validează parametrii de sortare
   */
  static validateSortParams({ sortBy, order }) {
    const validSortFields = ["createdAt", "updatedAt", "total", "offerNumber", "status"];
    const validOrders = ["asc", "desc"];

    if (sortBy && !validSortFields.includes(sortBy)) {
      throw new ValidationError(`Câmpul de sortare invalid. Câmpurile valide sunt: ${validSortFields.join(', ')}.`);
    }

    if (order && !validOrders.includes(order)) {
      throw new ValidationError(`Ordinea de sortare invalidă. Valorile valide sunt: ${validOrders.join(', ')}.`);
    }
  }

  /**
   * Validează datele pentru actualizarea produselor
   */
  static validateProductUpdate(products) {
    if (!Array.isArray(products)) {
      throw new ValidationError("Lista de produse trebuie să fie un array.");
    }

    if (products.length === 0) {
      throw new ValidationError("Lista de produse nu poate fi goală.");
    }

    const errors = [];
    products.forEach((product, index) => {
      this.validateOfferPart(product, index, errors);
      
      // Validări suplimentare pentru actualizare
      if (product.deliveryTerm && !product.deliveryTerm.trim()) {
        errors.push(`Piesa ${index + 1}: Termenul de livrare nu poate fi gol dacă este specificat.`);
      }
    });

    if (errors.length > 0) {
      throw new ValidationError(errors.join(" "));
    }
  }

  /**
   * Validează numărul ofertei
   */
  static validateOfferNumber(offerNumber) {
    if (!offerNumber) {
      throw new ValidationError("Numărul ofertei este obligatoriu.");
    }

    const numOfferNumber = parseInt(offerNumber);
    if (isNaN(numOfferNumber) || numOfferNumber <= 0) {
      throw new ValidationError("Numărul ofertei trebuie să fie un număr pozitiv.");
    }
  }

  /**
   * Validează datele pentru actualizarea unei oferte
   */
  static validateUpdateOffer(data) {
    const { parts, deliveryTerms, validityDays, notes } = data;
    const errors = [];

    if (parts !== undefined) {
      if (!Array.isArray(parts)) {
        errors.push("Lista de piese trebuie să fie un array.");
      } else if (parts.length > 0) {
        parts.forEach((part, index) => {
          this.validateOfferPart(part, index, errors);
        });
      }
    }

    if (deliveryTerms !== undefined && typeof deliveryTerms !== 'string') {
      errors.push("Termenii de livrare trebuie să fie text.");
    }

    if (validityDays !== undefined) {
      const validity = parseInt(validityDays);
      if (isNaN(validity) || validity <= 0 || validity > 365) {
        errors.push("Validitatea trebuie să fie între 1 și 365 de zile.");
      }
    }

    if (notes !== undefined && typeof notes !== 'string') {
      errors.push("Notele trebuie să fie text.");
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(" "));
    }
  }

  /**
   * Alias pentru validarea produselor (compatibilitate)
   */
  static validateProducts(products) {
    return this.validateProductUpdate(products);
  }
}