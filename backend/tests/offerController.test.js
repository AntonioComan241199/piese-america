import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { OfferService } from '../services/offerService.js';
import { OfferEmailService } from '../services/offerEmailService.js';
import { NotificationService } from '../services/notificationService.js';

// Mock-uri pentru servicii
vi.mock('../services/offerService.js');
vi.mock('../services/offerEmailService.js');
vi.mock('../services/notificationService.js');
vi.mock('../models/Order.js');

describe('Offer Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    role: 'admin'
  };

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

  describe('POST /api/offers', () => {
    it('should create a new offer successfully', async () => {
      // Arrange
      const mockOffer = {
        _id: 'offer123',
        offerNumber: 1001,
        orderId: validOfferData.orderId,
        total: 301
      };

      OfferService.createOffer.mockResolvedValue(mockOffer);
      NotificationService.createNewOrderNotification.mockResolvedValue({});

      // Act
      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', 'Bearer admintoken')
        .send(validOfferData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Oferta a fost creată cu succes.');
      expect(response.body.offer).toEqual(mockOffer);
      expect(OfferService.createOffer).toHaveBeenCalledWith(
        validOfferData.orderId, 
        validOfferData.parts
      );
    });

    it('should return 400 for invalid offer data', async () => {
      // Arrange
      const invalidData = { ...validOfferData };
      delete invalidData.orderId;

      // Act
      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', 'Bearer admintoken')
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for empty parts array', async () => {
      // Arrange
      const invalidData = { ...validOfferData, parts: [] };

      // Act
      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', 'Bearer admintoken')
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Lista de piese');
    });
  });

  describe('GET /api/offers/admin', () => {
    it('should return paginated offers for admin', async () => {
      // Arrange
      const mockResult = {
        offers: [
          { _id: '1', offerNumber: 1001, status: 'proiect' },
          { _id: '2', offerNumber: 1002, status: 'trimisa' }
        ],
        pagination: {
          total: 2,
          page: 1,
          pages: 1
        }
      };

      OfferService.buildOfferFilters.mockReturnValue({ status: 'proiect' });
      OfferService.getOffersWithPagination.mockResolvedValue(mockResult);

      // Act
      const response = await request(app)
        .get('/api/offers/admin?status=proiect&page=1&limit=10')
        .set('Authorization', 'Bearer admintoken');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should validate pagination parameters', async () => {
      // Act
      const response = await request(app)
        .get('/api/offers/admin?page=0&limit=150')
        .set('Authorization', 'Bearer admintoken');

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/offers/user', () => {
    it('should return user offers', async () => {
      // Arrange
      const mockResult = {
        offers: [
          { _id: '1', offerNumber: 1001, status: 'proiect' }
        ],
        pagination: {
          total: 1,
          page: 1,
          pages: 1
        }
      };

      OfferService.buildOfferFilters.mockReturnValue({});
      OfferService.getOffersWithPagination.mockResolvedValue(mockResult);

      // Act
      const response = await request(app)
        .get('/api/offers/user')
        .set('Authorization', 'Bearer usertoken');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/offers/:offerId', () => {
    it('should return offer by ID', async () => {
      // Arrange
      const mockOffer = {
        _id: 'offer123',
        offerNumber: 1001,
        orderId: {
          orderNumber: 2001,
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      OfferService.findOfferById.mockResolvedValue(mockOffer);

      // Act
      const response = await request(app)
        .get('/api/offers/offer123')
        .set('Authorization', 'Bearer usertoken');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.offer).toEqual(mockOffer);
    });

    it('should return 404 for non-existent offer', async () => {
      // Arrange
      OfferService.findOfferById.mockRejectedValue(new Error('NotFoundError'));

      // Act
      const response = await request(app)
        .get('/api/offers/nonexistent')
        .set('Authorization', 'Bearer usertoken');

      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/offers/:offerId', () => {
    it('should delete offer successfully', async () => {
      // Arrange
      OfferService.deleteOffer.mockResolvedValue({
        _id: 'offer123',
        offerNumber: 1001
      });

      // Act
      const response = await request(app)
        .delete('/api/offers/offer123')
        .set('Authorization', 'Bearer admintoken');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Oferta a fost ștearsă cu succes.');
    });
  });

  describe('PUT /api/offers/:offerId/status', () => {
    it('should update offer status successfully', async () => {
      // Arrange
      const mockOffer = {
        _id: 'offer123',
        status: 'trimisa'
      };

      OfferService.updateOfferStatus.mockResolvedValue(mockOffer);

      // Act
      const response = await request(app)
        .put('/api/offers/offer123/status')
        .set('Authorization', 'Bearer admintoken')
        .send({ status: 'trimisa' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('trimisa');
    });

    it('should return 400 for invalid status', async () => {
      // Act
      const response = await request(app)
        .put('/api/offers/offer123/status')
        .set('Authorization', 'Bearer admintoken')
        .send({ status: 'invalid_status' });

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/offers/:offerId/accept', () => {
    it('should accept offer successfully', async () => {
      // Arrange
      const mockResult = {
        offer: { _id: 'offer123', status: 'oferta_acceptata', offerNumber: 1001 },
        order: { _id: 'order123', status: 'oferta_acceptata' }
      };

      OfferService.acceptOffer.mockResolvedValue(mockResult);

      // Act
      const response = await request(app)
        .post('/api/offers/offer123/accept')
        .set('Authorization', 'Bearer usertoken');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Oferta a fost acceptată cu succes.');
    });
  });

  describe('POST /api/offers/:offerId/reject', () => {
    it('should reject offer successfully', async () => {
      // Arrange
      const mockResult = {
        offer: { _id: 'offer123', status: 'anulata', offerNumber: 1001 },
        order: { _id: 'order123', status: 'anulata' }
      };

      OfferService.rejectOffer.mockResolvedValue(mockResult);

      // Act
      const response = await request(app)
        .post('/api/offers/offer123/reject')
        .set('Authorization', 'Bearer usertoken');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Oferta a fost anulată cu succes.');
    });
  });

  describe('PUT /api/offers/:offerId/delivery-status', () => {
    it('should update delivery status successfully', async () => {
      // Arrange
      const mockResult = {
        offer: { _id: 'offer123', status: 'livrata', offerNumber: 1001 },
        order: { _id: 'order123', status: 'livrata' }
      };

      OfferService.updateDeliveryStatus.mockResolvedValue(mockResult);

      // Act
      const response = await request(app)
        .put('/api/offers/offer123/delivery-status')
        .set('Authorization', 'Bearer admintoken')
        .send({ deliveryStatus: 'livrata' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Statusul livrării a fost actualizat cu succes.');
    });

    it('should return 400 for invalid delivery status', async () => {
      // Act
      const response = await request(app)
        .put('/api/offers/offer123/delivery-status')
        .set('Authorization', 'Bearer admintoken')
        .send({ deliveryStatus: 'invalid_status' });

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/offers/:offerId/selected-parts', () => {
    it('should update selected parts successfully', async () => {
      // Arrange
      const selectedParts = [
        { selectedOption: '507f1f77bcf86cd799439011' }
      ];

      const billingAddress = {
        street: 'Strada Principală',
        number: '123',
        city: 'București',
        county: 'Ilfov'
      };

      const mockOffer = {
        _id: 'offer123',
        selectedParts,
        billingAddress
      };

      OfferService.updateSelectedParts.mockResolvedValue(mockOffer);

      // Act
      const response = await request(app)
        .put('/api/offers/offer123/selected-parts')
        .set('Authorization', 'Bearer usertoken')
        .send({
          selectedParts,
          billingAddress,
          pickupAtCentral: false
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Piesele selectate și adresele au fost actualizate cu succes.');
    });

    it('should return 400 for invalid selected parts', async () => {
      // Act
      const response = await request(app)
        .put('/api/offers/offer123/selected-parts')
        .set('Authorization', 'Bearer usertoken')
        .send({
          selectedParts: [],
          billingAddress: {}
        });

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/offers/:offerId/quantities', () => {
    it('should update quantities successfully', async () => {
      // Arrange
      const quantities = { 'BP001': 3, 'BP002': 1 };
      const mockOffer = {
        _id: 'offer123',
        parts: [
          { partCode: 'BP001', quantity: 3 },
          { partCode: 'BP002', quantity: 1 }
        ]
      };

      OfferService.updateQuantities.mockResolvedValue(mockOffer);

      // Act
      const response = await request(app)
        .put('/api/offers/offer123/quantities')
        .set('Authorization', 'Bearer admintoken')
        .send({ quantities });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cantitățile au fost actualizate.');
    });

    it('should return 400 for invalid quantities', async () => {
      // Act
      const response = await request(app)
        .put('/api/offers/offer123/quantities')
        .set('Authorization', 'Bearer admintoken')
        .send({ quantities: { 'BP001': -1 } });

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/offers/export', () => {
    it('should export offers as CSV', async () => {
      // Arrange
      OfferService.exportOffers.mockResolvedValue('OfferNumber,OrderNumber,Total,Status,CreatedAt\n1001,2001,300,proiect,2024-01-01');

      // Act
      const response = await request(app)
        .get('/api/offers/export?format=csv')
        .set('Authorization', 'Bearer admintoken');

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/octet-stream');
    });

    it('should export offers as PDF', async () => {
      // Arrange
      OfferService.exportOffers.mockResolvedValue('OfferNumber,OrderNumber,Total,Status,CreatedAt\n1001,2001,300,proiect,2024-01-01');

      // Act
      const response = await request(app)
        .get('/api/offers/export?format=pdf')
        .set('Authorization', 'Bearer admintoken');

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
    });

    it('should return 400 for invalid format', async () => {
      // Act
      const response = await request(app)
        .get('/api/offers/export?format=xml')
        .set('Authorization', 'Bearer admintoken');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Format de export invalid');
    });
  });

  describe('GET /api/offers/stats', () => {
    it('should return offer statistics', async () => {
      // Arrange
      const mockStats = [
        { _id: 1, total: 5000, count: 10 },
        { _id: 2, total: 7500, count: 15 }
      ];

      OfferService.getOfferStats.mockResolvedValue(mockStats);

      // Act
      const response = await request(app)
        .get('/api/offers/stats')
        .set('Authorization', 'Bearer admintoken');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toEqual(mockStats);
    });
  });

  describe('POST /api/offers/send-email', () => {
    it('should send offer email successfully', async () => {
      // Arrange
      const mockEmailService = {
        sendOfferToClient: vi.fn().mockResolvedValue({
          success: true,
          sentTo: 'client@example.com'
        })
      };

      // Act
      const response = await request(app)
        .post('/api/offers/send-email')
        .set('Authorization', 'Bearer admintoken')
        .send({ offerNumber: 1001 });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email-ul cu link-ul ofertei a fost trimis cu succes.');
    });

    it('should return 400 for missing offer number', async () => {
      // Act
      const response = await request(app)
        .post('/api/offers/send-email')
        .set('Authorization', 'Bearer admintoken')
        .send({});

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/offers/accept-email', () => {
    it('should send acceptance email to admin successfully', async () => {
      // Arrange
      const mockEmailService = {
        sendAcceptanceEmailToAdmin: vi.fn().mockResolvedValue({
          success: true,
          sentTo: 'admin@example.com'
        })
      };

      // Act
      const response = await request(app)
        .post('/api/offers/accept-email')
        .set('Authorization', 'Bearer usertoken')
        .send({ offerNumber: 1001 });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email-ul de acceptare a fost trimis administratorului cu succes.');
    });
  });

  describe('POST /api/offers/reject-email', () => {
    it('should send rejection email to admin successfully', async () => {
      // Arrange
      const mockEmailService = {
        sendRejectionEmailToAdmin: vi.fn().mockResolvedValue({
          success: true,
          sentTo: 'admin@example.com'
        })
      };

      // Act
      const response = await request(app)
        .post('/api/offers/reject-email')
        .set('Authorization', 'Bearer usertoken')
        .send({ offerNumber: 1001 });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email-ul de respingere a fost trimis administratorului cu succes.');
    });
  });
});