import { describe, it, expect } from 'vitest';
import { OfferValidator } from '../validators/offerValidator.js';
import { ValidationError } from '../utils/errors.js';

describe('OfferValidator', () => {
  const validOfferData = {
    orderId: '507f1f77bcf86cd799439011',
    parts: [
      {
        partCode: 'BP001',
        partType: 'Brake Pads',
        manufacturer: 'Bosch',
        pricePerUnit: 150.50,
        quantity: 2
      }
    ]
  };

  describe('validateCreateOffer', () => {
    it('should validate valid offer data', () => {
      expect(() => {
        OfferValidator.validateCreateOffer(validOfferData);
      }).not.toThrow();
    });

    it('should throw error for missing orderId', () => {
      const invalidData = { ...validOfferData };
      delete invalidData.orderId;

      expect(() => {
        OfferValidator.validateCreateOffer(invalidData);
      }).toThrow('ID-ul cererii este obligatoriu');
    });

    it('should throw error for invalid orderId', () => {
      const invalidData = { ...validOfferData, orderId: 'invalid-id' };

      expect(() => {
        OfferValidator.validateCreateOffer(invalidData);
      }).toThrow('ID-ul cererii este invalid');
    });

    it('should throw error for empty parts array', () => {
      const invalidData = { ...validOfferData, parts: [] };

      expect(() => {
        OfferValidator.validateCreateOffer(invalidData);
      }).toThrow('Lista de piese este obligatorie');
    });

    it('should throw error for missing parts', () => {
      const invalidData = { ...validOfferData };
      delete invalidData.parts;

      expect(() => {
        OfferValidator.validateCreateOffer(invalidData);
      }).toThrow('Lista de piese este obligatorie');
    });
  });

  describe('validateOfferPart', () => {
    it('should validate valid part', () => {
      const validPart = {
        partCode: 'BP001',
        partType: 'Brake Pads',
        manufacturer: 'Bosch',
        pricePerUnit: 150.50,
        quantity: 2
      };

      const errors = [];
      OfferValidator.validateOfferPart(validPart, 0, errors);

      expect(errors).toHaveLength(0);
    });

    it('should add error for missing partCode', () => {
      const invalidPart = {
        partType: 'Brake Pads',
        manufacturer: 'Bosch',
        pricePerUnit: 150.50,
        quantity: 2
      };

      const errors = [];
      OfferValidator.validateOfferPart(invalidPart, 0, errors);

      expect(errors).toContain('Piesa 1: Codul piesei este obligatoriu.');
    });

    it('should add error for invalid price', () => {
      const invalidPart = {
        partCode: 'BP001',
        partType: 'Brake Pads',
        manufacturer: 'Bosch',
        pricePerUnit: -10,
        quantity: 2
      };

      const errors = [];
      OfferValidator.validateOfferPart(invalidPart, 0, errors);

      expect(errors).toContain('Piesa 1: Prețul per unitate trebuie să fie un număr pozitiv.');
    });

    it('should add error for invalid quantity', () => {
      const invalidPart = {
        partCode: 'BP001',
        partType: 'Brake Pads',
        manufacturer: 'Bosch',
        pricePerUnit: 150.50,
        quantity: 1.5 // not integer
      };

      const errors = [];
      OfferValidator.validateOfferPart(invalidPart, 0, errors);

      expect(errors).toContain('Piesa 1: Cantitatea trebuie să fie un număr întreg pozitiv.');
    });

    it('should add warning for unusually high price', () => {
      const expensivePart = {
        partCode: 'BP001',
        partType: 'Brake Pads',
        manufacturer: 'Bosch',
        pricePerUnit: 150000,
        quantity: 1
      };

      const errors = [];
      OfferValidator.validateOfferPart(expensivePart, 0, errors);

      expect(errors).toContain('Piesa 1: Prețul pare neobișnuit de mare. Verificați dacă este corect.');
    });
  });

  describe('validateSelectedParts', () => {
    it('should validate valid selected parts', () => {
      const validSelectedParts = [
        { selectedOption: '507f1f77bcf86cd799439011' },
        { selectedOption: '507f1f77bcf86cd799439012' }
      ];

      expect(() => {
        OfferValidator.validateSelectedParts(validSelectedParts);
      }).not.toThrow();
    });

    it('should throw error for empty selected parts', () => {
      expect(() => {
        OfferValidator.validateSelectedParts([]);
      }).toThrow('Lista de piese selectate este obligatorie');
    });

    it('should throw error for missing selectedOption', () => {
      const invalidSelectedParts = [
        { selectedOption: '507f1f77bcf86cd799439011' },
        {} // missing selectedOption
      ];

      expect(() => {
        OfferValidator.validateSelectedParts(invalidSelectedParts);
      }).toThrow('Piesa 2 nu are o opțiune selectată');
    });

    it('should throw error for invalid selectedOption', () => {
      const invalidSelectedParts = [
        { selectedOption: 'invalid-id' }
      ];

      expect(() => {
        OfferValidator.validateSelectedParts(invalidSelectedParts);
      }).toThrow('Opțiunea selectată pentru piesa 1 este invalidă');
    });
  });

  describe('validateQuantities', () => {
    it('should validate valid quantities', () => {
      const validQuantities = {
        'BP001': 2,
        'BP002': 1,
        'BP003': 3
      };

      expect(() => {
        OfferValidator.validateQuantities(validQuantities);
      }).not.toThrow();
    });

    it('should throw error for invalid quantities object', () => {
      expect(() => {
        OfferValidator.validateQuantities(null);
      }).toThrow('Obiectul cantități este invalid');

      expect(() => {
        OfferValidator.validateQuantities('invalid');
      }).toThrow('Obiectul cantități este invalid');
    });

    it('should throw error for invalid quantity values', () => {
      const invalidQuantities = {
        'BP001': -1,
        'BP002': 0,
        'BP003': 'invalid'
      };

      expect(() => {
        OfferValidator.validateQuantities(invalidQuantities);
      }).toThrow(ValidationError);
    });

    it('should throw error for unusually high quantities', () => {
      const highQuantities = {
        'BP001': 1500
      };

      expect(() => {
        OfferValidator.validateQuantities(highQuantities);
      }).toThrow('Cantitatea pentru BP001 pare neobișnuit de mare');
    });

    it('should throw error for empty part code', () => {
      const invalidQuantities = {
        '': 2,
        'BP001': 1
      };

      expect(() => {
        OfferValidator.validateQuantities(invalidQuantities);
      }).toThrow('Codul piesei nu poate fi gol');
    });
  });

  describe('validateOfferStatus', () => {
    it('should validate valid statuses', () => {
      const validStatuses = [
        'proiect', 'trimisa', 'oferta_acceptata', 
        'oferta_respinsa', 'livrare_in_procesare', 
        'livrata', 'anulata'
      ];

      validStatuses.forEach(status => {
        expect(() => {
          OfferValidator.validateOfferStatus(status);
        }).not.toThrow();
      });
    });

    it('should throw error for invalid status', () => {
      expect(() => {
        OfferValidator.validateOfferStatus('invalid_status');
      }).toThrow('Status invalid');
    });
  });

  describe('validateDeliveryStatus', () => {
    it('should validate valid delivery statuses', () => {
      const validStatuses = ['livrare_in_procesare', 'livrata', 'anulata'];

      validStatuses.forEach(status => {
        expect(() => {
          OfferValidator.validateDeliveryStatus(status);
        }).not.toThrow();
      });
    });

    it('should throw error for invalid delivery status', () => {
      expect(() => {
        OfferValidator.validateDeliveryStatus('invalid_status');
      }).toThrow('Status de livrare invalid');
    });
  });

  describe('validateBillingAddress', () => {
    it('should validate valid billing address', () => {
      const validAddress = {
        street: 'Strada Principală',
        number: '123',
        city: 'București',
        county: 'Ilfov'
      };

      expect(() => {
        OfferValidator.validateBillingAddress(validAddress);
      }).not.toThrow();
    });

    it('should allow undefined address', () => {
      expect(() => {
        OfferValidator.validateBillingAddress(undefined);
      }).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const invalidAddress = {
        street: 'Strada Principală',
        // missing number, city, county
      };

      expect(() => {
        OfferValidator.validateBillingAddress(invalidAddress);
      }).toThrow(ValidationError);
    });

    it('should throw error for empty required fields', () => {
      const invalidAddress = {
        street: '',
        number: '123',
        city: 'București',
        county: 'Ilfov'
      };

      expect(() => {
        OfferValidator.validateBillingAddress(invalidAddress);
      }).toThrow('street este obligatoriu pentru adresa de facturare');
    });
  });

  describe('validateDeliveryAddress', () => {
    it('should skip validation when pickup at central', () => {
      expect(() => {
        OfferValidator.validateDeliveryAddress(undefined, true);
      }).not.toThrow();
    });

    it('should require address when not pickup at central', () => {
      expect(() => {
        OfferValidator.validateDeliveryAddress(undefined, false);
      }).toThrow('Adresa de livrare este obligatorie');
    });

    it('should validate address when provided', () => {
      const validAddress = {
        street: 'Strada Principală',
        number: '123',
        city: 'București',
        county: 'Ilfov'
      };

      expect(() => {
        OfferValidator.validateDeliveryAddress(validAddress, false);
      }).not.toThrow();
    });
  });

  describe('validatePagination', () => {
    it('should validate valid pagination', () => {
      expect(() => {
        OfferValidator.validatePagination({ page: 1, limit: 10 });
      }).not.toThrow();
    });

    it('should throw error for invalid page', () => {
      expect(() => {
        OfferValidator.validatePagination({ page: 0 });
      }).toThrow('Numărul paginii trebuie să fie un număr pozitiv');
    });

    it('should throw error for invalid limit', () => {
      expect(() => {
        OfferValidator.validatePagination({ limit: 150 });
      }).toThrow('Limita trebuie să fie un număr între 1 și 100');
    });
  });

  describe('validateSortParams', () => {
    it('should validate valid sort parameters', () => {
      expect(() => {
        OfferValidator.validateSortParams({ sortBy: 'createdAt', order: 'desc' });
      }).not.toThrow();
    });

    it('should throw error for invalid sortBy field', () => {
      expect(() => {
        OfferValidator.validateSortParams({ sortBy: 'invalidField' });
      }).toThrow('Câmpul de sortare invalid');
    });

    it('should throw error for invalid order', () => {
      expect(() => {
        OfferValidator.validateSortParams({ order: 'invalid' });
      }).toThrow('Ordinea de sortare invalidă');
    });
  });

  describe('validateProductUpdate', () => {
    it('should validate valid product update', () => {
      const validProducts = [
        {
          partCode: 'BP001',
          partType: 'Brake Pads',
          manufacturer: 'Bosch',
          pricePerUnit: 150.50,
          quantity: 2,
          deliveryTerm: '3-5 zile'
        }
      ];

      expect(() => {
        OfferValidator.validateProductUpdate(validProducts);
      }).not.toThrow();
    });

    it('should throw error for non-array products', () => {
      expect(() => {
        OfferValidator.validateProductUpdate('not-array');
      }).toThrow('Lista de produse trebuie să fie un array');
    });

    it('should throw error for empty products array', () => {
      expect(() => {
        OfferValidator.validateProductUpdate([]);
      }).toThrow('Lista de produse nu poate fi goală');
    });

    it('should throw error for empty delivery term', () => {
      const invalidProducts = [
        {
          partCode: 'BP001',
          partType: 'Brake Pads',
          manufacturer: 'Bosch',
          pricePerUnit: 150.50,
          quantity: 2,
          deliveryTerm: ''
        }
      ];

      expect(() => {
        OfferValidator.validateProductUpdate(invalidProducts);
      }).toThrow('Termenul de livrare nu poate fi gol');
    });
  });

  describe('validateOfferNumber', () => {
    it('should validate valid offer number', () => {
      expect(() => {
        OfferValidator.validateOfferNumber('1001');
      }).not.toThrow();

      expect(() => {
        OfferValidator.validateOfferNumber(1001);
      }).not.toThrow();
    });

    it('should throw error for missing offer number', () => {
      expect(() => {
        OfferValidator.validateOfferNumber(null);
      }).toThrow('Numărul ofertei este obligatoriu');

      expect(() => {
        OfferValidator.validateOfferNumber('');
      }).toThrow('Numărul ofertei este obligatoriu');
    });

    it('should throw error for invalid offer number', () => {
      expect(() => {
        OfferValidator.validateOfferNumber('invalid');
      }).toThrow('Numărul ofertei trebuie să fie un număr pozitiv');

      expect(() => {
        OfferValidator.validateOfferNumber(-1);
      }).toThrow('Numărul ofertei trebuie să fie un număr pozitiv');
    });
  });
});