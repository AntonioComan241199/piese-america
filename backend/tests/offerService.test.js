import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfferService } from '../services/offerService.js';
import Offer from '../models/Offer.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';

// Mock-uri
vi.mock('../models/Offer.js');
vi.mock('../models/Order.js');
vi.mock('mongoose');

describe('OfferService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateOfferParts', () => {
    it('should validate parts successfully', () => {
      const validParts = [
        {
          partCode: 'BP001',
          partType: 'Brake Pads',
          manufacturer: 'Bosch',
          pricePerUnit: 150.50,
          quantity: 2
        }
      ];

      expect(() => {
        OfferService.validateOfferParts(validParts);
      }).not.toThrow();
    });

    it('should throw error for empty parts array', () => {
      expect(() => {
        OfferService.validateOfferParts([]);
      }).toThrow(ValidationError);
    });

    it('should throw error for invalid price', () => {
      const invalidParts = [
        {
          partCode: 'BP001',
          partType: 'Brake Pads',
          manufacturer: 'Bosch',
          pricePerUnit: -10,
          quantity: 2
        }
      ];

      expect(() => {
        OfferService.validateOfferParts(invalidParts);
      }).toThrow(ValidationError);
    });

    it('should throw error for invalid quantity', () => {
      const invalidParts = [
        {
          partCode: 'BP001',
          partType: 'Brake Pads',
          manufacturer: 'Bosch',
          pricePerUnit: 150.50,
          quantity: 0
        }
      ];

      expect(() => {
        OfferService.validateOfferParts(invalidParts);
      }).toThrow(ValidationError);
    });
  });

  describe('processOfferParts', () => {
    it('should process parts and add options and totals', () => {
      const parts = [
        {
          partCode: 'BP001',
          partType: 'Brake Pads',
          manufacturer: 'Bosch',
          pricePerUnit: 100,
          quantity: 2
        }
      ];

      const processed = OfferService.processOfferParts(parts);

      expect(processed[0]).toEqual({
        partCode: 'BP001',
        partType: 'Brake Pads',
        manufacturer: 'Bosch',
        pricePerUnit: 100,
        quantity: 2,
        total: 200,
        options: [{
          manufacturer: 'Bosch',
          price: 100,
          description: 'Alternativa oferită de Bosch'
        }]
      });
    });
  });

  describe('createOffer', () => {
    it('should create offer successfully', async () => {
      // Arrange
      const mockOrder = {
        _id: 'order123',
        orderNumber: 1001,
        offerId: null
      };
      
      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn()
      };

      mongoose.startSession.mockResolvedValue(mockSession);
      Order.findById.mockReturnValue({
        session: vi.fn().mockResolvedValue(mockOrder)
      });

      const mockSavedOffer = {
        _id: 'offer123',
        offerNumber: 1001,
        orderId: 'order123',
        total: 200
      };

      Offer.mockImplementation(() => ({
        save: vi.fn().mockResolvedValue(mockSavedOffer)
      }));

      const mockSaveOrder = vi.fn().mockResolvedValue(mockOrder);
      mockOrder.save = mockSaveOrder;

      const parts = [
        { partCode: 'BP001', partType: 'Brake Pads', manufacturer: 'Bosch', pricePerUnit: 100, quantity: 2 }
      ];

      // Act
      const result = await OfferService.createOffer('order123', parts);

      // Assert
      expect(result).toEqual(mockSavedOffer);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockOrder.status).toBe('ofertat');
    });

    it('should throw error for invalid order ID', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await expect(OfferService.createOffer('invalid', [])).rejects.toThrow(ValidationError);
    });

    it('should throw error for non-existent order', async () => {
      const mockSession = {
        startTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn()
      };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      mongoose.startSession.mockResolvedValue(mockSession);
      Order.findById.mockReturnValue({
        session: vi.fn().mockResolvedValue(null)
      });

      const parts = [
        { partCode: 'BP001', partType: 'Brake Pads', manufacturer: 'Bosch', pricePerUnit: 100, quantity: 2 }
      ];

      await expect(OfferService.createOffer('order123', parts)).rejects.toThrow(NotFoundError);
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should throw error for order that already has offer', async () => {
      const mockOrder = {
        _id: 'order123',
        orderNumber: 1001,
        offerId: 'existingOffer123'
      };
      
      const mockSession = {
        startTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn()
      };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      mongoose.startSession.mockResolvedValue(mockSession);
      Order.findById.mockReturnValue({
        session: vi.fn().mockResolvedValue(mockOrder)
      });

      const parts = [
        { partCode: 'BP001', partType: 'Brake Pads', manufacturer: 'Bosch', pricePerUnit: 100, quantity: 2 }
      ];

      await expect(OfferService.createOffer('order123', parts)).rejects.toThrow(ConflictError);
    });
  });

  describe('buildOfferFilters', () => {
    it('should build basic filters', () => {
      const queryParams = {
        status: 'proiect',
        offerNumber: '1001'
      };

      const filters = OfferService.buildOfferFilters(queryParams);

      expect(filters).toEqual({
        status: 'proiect',
        offerNumber: 1001
      });
    });

    it('should build date range filter', () => {
      const queryParams = {
        selectedDate: '2024-01-15'
      };

      const filters = OfferService.buildOfferFilters(queryParams);

      expect(filters.createdAt).toHaveProperty('$gte');
      expect(filters.createdAt).toHaveProperty('$lte');
    });

    it('should throw error for invalid status', () => {
      const queryParams = {
        status: 'invalid_status'
      };

      expect(() => {
        OfferService.buildOfferFilters(queryParams);
      }).toThrow(ValidationError);
    });

    it('should throw error for invalid offer number', () => {
      const queryParams = {
        offerNumber: 'invalid'
      };

      expect(() => {
        OfferService.buildOfferFilters(queryParams);
      }).toThrow(ValidationError);
    });

    it('should include user orders filter when provided', () => {
      const queryParams = { status: 'proiect' };
      const userOrders = ['order1', 'order2'];

      const filters = OfferService.buildOfferFilters(queryParams, userOrders);

      expect(filters.orderId).toEqual({ $in: userOrders });
    });
  });

  describe('getOffersWithPagination', () => {
    it('should return paginated offers', async () => {
      const mockOffers = [
        { _id: '1', offerNumber: 1001 },
        { _id: '2', offerNumber: 1002 }
      ];

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockOffers)
      };

      Offer.find.mockReturnValue(mockQuery);
      Offer.countDocuments.mockResolvedValue(25);

      const result = await OfferService.getOffersWithPagination(
        { status: 'proiect' },
        { page: 2, limit: 10, sortBy: 'createdAt', order: 'desc' }
      );

      expect(result.offers).toEqual(mockOffers);
      expect(result.pagination).toEqual({
        total: 25,
        page: 2,
        pages: 3
      });
      expect(mockQuery.skip).toHaveBeenCalledWith(10);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('findOfferById', () => {
    it('should find offer by id', async () => {
      const mockOffer = { _id: 'offer123', offerNumber: 1001 };
      
      Offer.findById.mockResolvedValue(mockOffer);

      const result = await OfferService.findOfferById('offer123');

      expect(result).toEqual(mockOffer);
      expect(Offer.findById).toHaveBeenCalledWith('offer123');
    });

    it('should find offer by id with populate', async () => {
      const mockOffer = { _id: 'offer123', offerNumber: 1001 };
      const mockQuery = {
        populate: vi.fn().mockResolvedValue(mockOffer)
      };
      
      Offer.findById.mockReturnValue(mockQuery);

      const result = await OfferService.findOfferById('offer123', 'orderId');

      expect(result).toEqual(mockOffer);
      expect(mockQuery.populate).toHaveBeenCalledWith('orderId');
    });

    it('should throw NotFoundError when offer not found', async () => {
      Offer.findById.mockResolvedValue(null);

      await expect(OfferService.findOfferById('nonexistent'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteOffer', () => {
    it('should delete offer and update order', async () => {
      const mockOffer = {
        _id: 'offer123',
        orderId: 'order123'
      };

      const mockOrder = {
        _id: 'order123',
        offerId: 'offer123',
        status: 'ofertat',
        save: vi.fn().mockResolvedValue()
      };

      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn()
      };

      mongoose.startSession.mockResolvedValue(mockSession);
      Offer.findByIdAndDelete.mockReturnValue({
        session: vi.fn().mockResolvedValue(mockOffer)
      });
      Order.findById.mockReturnValue({
        session: vi.fn().mockResolvedValue(mockOrder)
      });

      const result = await OfferService.deleteOffer('offer123');

      expect(result).toEqual(mockOffer);
      expect(mockOrder.offerId).toBe(null);
      expect(mockOrder.status).toBe('asteptare_oferta');
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundError when offer not found', async () => {
      const mockSession = {
        startTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn()
      };

      mongoose.startSession.mockResolvedValue(mockSession);
      Offer.findByIdAndDelete.mockReturnValue({
        session: vi.fn().mockResolvedValue(null)
      });

      await expect(OfferService.deleteOffer('nonexistent'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateOfferStatus', () => {
    it('should update offer status', async () => {
      const mockOffer = {
        _id: 'offer123',
        status: 'proiect',
        logs: [],
        save: vi.fn().mockResolvedValue()
      };

      Offer.findById.mockResolvedValue(mockOffer);

      const result = await OfferService.updateOfferStatus('offer123', 'trimisa', 'user123');

      expect(mockOffer.status).toBe('trimisa');
      expect(mockOffer.save).toHaveBeenCalled();
      expect(result).toEqual(mockOffer);
    });

    it('should throw ValidationError for invalid status', async () => {
      const mockOffer = { _id: 'offer123' };
      Offer.findById.mockResolvedValue(mockOffer);

      await expect(OfferService.updateOfferStatus('offer123', 'invalid_status'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('acceptOffer', () => {
    it('should accept offer and update order', async () => {
      const mockOffer = {
        _id: 'offer123',
        orderId: 'order123',
        status: 'proiect',
        save: vi.fn().mockResolvedValue()
      };

      const mockOrder = {
        _id: 'order123',
        status: 'ofertat',
        save: vi.fn().mockResolvedValue()
      };

      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        endSession: vi.fn()
      };

      mongoose.startSession.mockResolvedValue(mockSession);
      Offer.findById.mockReturnValue({
        session: vi.fn().mockResolvedValue(mockOffer)
      });
      Order.findById.mockReturnValue({
        session: vi.fn().mockResolvedValue(mockOrder)
      });

      const result = await OfferService.acceptOffer('offer123', 'user123');

      expect(result.offer.status).toBe('oferta_acceptata');
      expect(result.order.status).toBe('oferta_acceptata');
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('updateQuantities', () => {
    it('should update quantities successfully', async () => {
      const mockOffer = {
        _id: 'offer123',
        status: 'proiect',
        parts: [
          { partCode: 'BP001', quantity: 1, pricePerUnit: 100, total: 100 },
          { partCode: 'BP002', quantity: 2, pricePerUnit: 50, total: 100 }
        ],
        total: 200,
        save: vi.fn().mockResolvedValue()
      };

      Offer.findById.mockResolvedValue(mockOffer);

      const quantities = { 'BP001': 3, 'BP002': 1 };
      const result = await OfferService.updateQuantities('offer123', quantities);

      expect(mockOffer.parts[0].quantity).toBe(3);
      expect(mockOffer.parts[0].total).toBe(300);
      expect(mockOffer.parts[1].quantity).toBe(1);
      expect(mockOffer.parts[1].total).toBe(50);
      expect(mockOffer.total).toBe(350);
    });

    it('should throw error for non-project status', async () => {
      const mockOffer = {
        status: 'trimisa'
      };

      Offer.findById.mockResolvedValue(mockOffer);

      await expect(OfferService.updateQuantities('offer123', { 'BP001': 2 }))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('exportOffers', () => {
    it('should export offers as CSV', async () => {
      const mockOffers = [
        {
          offerNumber: 1001,
          orderId: { orderNumber: 2001 },
          total: 300,
          status: 'proiect',
          createdAt: new Date('2024-01-01')
        }
      ];

      const mockQuery = {
        populate: vi.fn().mockResolvedValue(mockOffers)
      };
      Offer.find.mockReturnValue(mockQuery);

      const result = await OfferService.exportOffers();

      expect(result).toContain('OfferNumber,OrderNumber,Total,Status,CreatedAt');
      expect(result).toContain('1001,2001,300,proiect');
    });
  });
});