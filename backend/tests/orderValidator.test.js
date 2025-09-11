import { describe, it, expect } from 'vitest';
import { OrderValidator } from '../validators/orderValidator.js';
import { ValidationError } from '../utils/errors.js';

describe('OrderValidator', () => {
  const validOrderData = {
    userType: 'persoana_fizica',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '0721234567',
    carMake: 'Ford',
    carModel: 'Focus',
    carYear: 2020,
    partDetails: 'Plăcuțe frână față'
  };

  describe('validateCreateOrder', () => {
    it('should not throw for valid order data', () => {
      expect(() => {
        OrderValidator.validateCreateOrder(validOrderData);
      }).not.toThrow();
    });

    describe('email validation', () => {
      it('should throw for missing email', () => {
        const invalidData = { ...validOrderData };
        delete invalidData.email;

        expect(() => {
          OrderValidator.validateCreateOrder(invalidData);
        }).toThrow(ValidationError);
      });

      it('should throw for invalid email format', () => {
        const invalidData = { ...validOrderData, email: 'invalid-email' };

        expect(() => {
          OrderValidator.validateCreateOrder(invalidData);
        }).toThrow('Email valid este obligatoriu');
      });

      it('should accept valid email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'test+label@gmail.com'
        ];

        validEmails.forEach(email => {
          expect(() => {
            OrderValidator.validateCreateOrder({ ...validOrderData, email });
          }).not.toThrow();
        });
      });
    });

    describe('phone number validation', () => {
      it('should throw for missing phone number', () => {
        const invalidData = { ...validOrderData };
        delete invalidData.phoneNumber;

        expect(() => {
          OrderValidator.validateCreateOrder(invalidData);
        }).toThrow('Număr de telefon valid este obligatoriu');
      });

      it('should accept valid Romanian phone numbers', () => {
        const validPhoneNumbers = [
          '0721234567',
          '0741234567',
          '+40721234567'
        ];

        validPhoneNumbers.forEach(phoneNumber => {
          expect(() => {
            OrderValidator.validateCreateOrder({ ...validOrderData, phoneNumber });
          }).not.toThrow();
        });
      });

      it('should throw for invalid phone numbers', () => {
        const invalidPhoneNumbers = [
          '123',
          '0721',
          '+1234567890',
          'not-a-phone'
        ];

        invalidPhoneNumbers.forEach(phoneNumber => {
          expect(() => {
            OrderValidator.validateCreateOrder({ ...validOrderData, phoneNumber });
          }).toThrow('Număr de telefon valid este obligatoriu');
        });
      });
    });

    describe('car data validation', () => {
      it('should throw for missing car make', () => {
        const invalidData = { ...validOrderData };
        delete invalidData.carMake;

        expect(() => {
          OrderValidator.validateCreateOrder(invalidData);
        }).toThrow('Marca mașinii este obligatorie');
      });

      it('should throw for missing car model', () => {
        const invalidData = { ...validOrderData };
        delete invalidData.carModel;

        expect(() => {
          OrderValidator.validateCreateOrder(invalidData);
        }).toThrow('Modelul mașinii este obligatoriu');
      });

      it('should throw for invalid car year', () => {
        const invalidData = { ...validOrderData, carYear: 1800 };

        expect(() => {
          OrderValidator.validateCreateOrder(invalidData);
        }).toThrow('An valid al mașinii este obligatoriu');
      });

      it('should accept valid car years', () => {
        const currentYear = new Date().getFullYear();
        const validYears = [1900, 2000, currentYear, currentYear + 1];

        validYears.forEach(carYear => {
          expect(() => {
            OrderValidator.validateCreateOrder({ ...validOrderData, carYear });
          }).not.toThrow();
        });
      });
    });

    describe('user type validation', () => {
      it('should validate physical person data', () => {
        const physicalPersonData = {
          ...validOrderData,
          userType: 'persoana_fizica'
        };

        expect(() => {
          OrderValidator.validateCreateOrder(physicalPersonData);
        }).not.toThrow();
      });

      it('should throw for missing first name in physical person', () => {
        const invalidData = {
          ...validOrderData,
          userType: 'persoana_fizica'
        };
        delete invalidData.firstName;

        expect(() => {
          OrderValidator.validateCreateOrder(invalidData);
        }).toThrow('Prenumele este obligatoriu pentru persoanele fizice');
      });

      it('should validate legal entity data', () => {
        const legalEntityData = {
          ...validOrderData,
          userType: 'persoana_juridica',
          companyDetails: {
            companyName: 'Test Company SRL',
            cui: 'RO12345678',
            nrRegCom: 'J40/1234/2020'
          }
        };
        delete legalEntityData.firstName;
        delete legalEntityData.lastName;

        expect(() => {
          OrderValidator.validateCreateOrder(legalEntityData);
        }).not.toThrow();
      });

      it('should throw for missing company details in legal entity', () => {
        const invalidData = {
          ...validOrderData,
          userType: 'persoana_juridica',
          companyDetails: {}
        };
        delete invalidData.firstName;
        delete invalidData.lastName;

        expect(() => {
          OrderValidator.validateCreateOrder(invalidData);
        }).toThrow('Numele companiei este obligatoriu pentru persoanele juridice');
      });

      it('should throw for invalid user type', () => {
        const invalidData = {
          ...validOrderData,
          userType: 'invalid_type'
        };

        expect(() => {
          OrderValidator.validateCreateOrder(invalidData);
        }).toThrow("Tipul de utilizator trebuie să fie 'persoana_fizica' sau 'persoana_juridica'");
      });
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+label@gmail.com',
        'user123@test-domain.org'
      ];

      validEmails.forEach(email => {
        expect(OrderValidator.isValidEmail(email)).toBe(true);
      });
    });

    it('should return false for invalid emails', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@domain.com',
        'test.domain.com',
        'test @domain.com'
      ];

      invalidEmails.forEach(email => {
        expect(OrderValidator.isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should return true for valid Romanian phone numbers', () => {
      const validNumbers = [
        '0721234567',
        '0741234567',
        '+40721234567',
        '+40 741 234 567' // with spaces
      ];

      validNumbers.forEach(phone => {
        expect(OrderValidator.isValidPhoneNumber(phone)).toBe(true);
      });
    });

    it('should return false for invalid phone numbers', () => {
      const invalidNumbers = [
        '123',
        '0721',
        '+1234567890',
        'not-a-phone',
        '00721234567' // wrong format
      ];

      invalidNumbers.forEach(phone => {
        expect(OrderValidator.isValidPhoneNumber(phone)).toBe(false);
      });
    });
  });

  describe('isValidYear', () => {
    it('should return true for valid years', () => {
      const currentYear = new Date().getFullYear();
      const validYears = [1900, 2000, currentYear, currentYear + 1];

      validYears.forEach(year => {
        expect(OrderValidator.isValidYear(year)).toBe(true);
      });
    });

    it('should return false for invalid years', () => {
      const currentYear = new Date().getFullYear();
      const invalidYears = [1899, currentYear + 2, 'not-a-year', null];

      invalidYears.forEach(year => {
        expect(OrderValidator.isValidYear(year)).toBe(false);
      });
    });
  });

  describe('validatePagination', () => {
    it('should not throw for valid pagination', () => {
      expect(() => {
        OrderValidator.validatePagination({ page: 1, limit: 10 });
      }).not.toThrow();
    });

    it('should throw for invalid page number', () => {
      expect(() => {
        OrderValidator.validatePagination({ page: 0 });
      }).toThrow('Numărul paginii trebuie să fie un număr pozitiv');
    });

    it('should throw for invalid limit', () => {
      expect(() => {
        OrderValidator.validatePagination({ limit: 150 });
      }).toThrow('Limita trebuie să fie un număr între 1 și 100');
    });
  });

  describe('validateComment', () => {
    it('should not throw for valid comment', () => {
      expect(() => {
        OrderValidator.validateComment('This is a valid comment');
      }).not.toThrow();
    });

    it('should throw for empty comment', () => {
      expect(() => {
        OrderValidator.validateComment('');
      }).toThrow('Textul comentariului este obligatoriu');
    });

    it('should throw for too long comment', () => {
      const longComment = 'a'.repeat(1001);
      expect(() => {
        OrderValidator.validateComment(longComment);
      }).toThrow('Comentariul nu poate depăși 1000 de caractere');
    });
  });
});