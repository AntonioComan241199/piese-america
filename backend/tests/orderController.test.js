import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import Order from '../models/Order.js';
import Counter from '../models/Counter.js';
import Notification from '../models/Notification.js';

// Mock-uri pentru modele
vi.mock('../models/Order.js');
vi.mock('../models/Counter.js');
vi.mock('../models/Notification.js');

describe('Order Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/orders', () => {
    const validOrderData = {
      userType: 'persoana_fizica',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '0721234567',
      carMake: 'Ford',
      carModel: 'Focus',
      carYear: 2020,
      fuelType: 'benzina',
      partDetails: 'Plăcuțe frână față'
    };

    it('should create a new order with valid data', async () => {
      // Arrange
      Counter.findOneAndUpdate.mockResolvedValue({ value: 1001 });
      Order.prototype.save = vi.fn().mockResolvedValue({
        ...validOrderData,
        orderNumber: 1001,
        _id: 'order123'
      });
      Notification.create.mockResolvedValue({});

      // Act
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer validtoken')
        .send(validOrderData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cererea de ofertă a fost creată cu succes!');
      expect(Counter.findOneAndUpdate).toHaveBeenCalledWith(
        { name: 'orderNumber' },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
    });

    it('should return 400 for missing required fields', async () => {
      // Arrange
      const invalidData = { ...validOrderData };
      delete invalidData.firstName;

      // Act
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer validtoken')
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      // Arrange
      const invalidEmailData = { ...validOrderData, email: 'invalid-email' };

      // Act
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer validtoken')
        .send(invalidEmailData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email valid este obligatoriu');
    });

    it('should validate phone number format', async () => {
      // Arrange
      const invalidPhoneData = { ...validOrderData, phoneNumber: '123' };

      // Act
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer validtoken')
        .send(invalidPhoneData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Număr de telefon valid este obligatoriu');
    });

    it('should validate company details for legal entities', async () => {
      // Arrange
      const legalEntityData = {
        ...validOrderData,
        userType: 'persoana_juridica',
        companyDetails: {} // Missing required fields
      };
      delete legalEntityData.firstName;
      delete legalEntityData.lastName;

      // Act
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer validtoken')
        .send(legalEntityData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('companiei');
    });
  });

  describe('GET /api/orders', () => {
    it('should return paginated orders', async () => {
      // Arrange
      const mockOrders = [
        { _id: '1', orderNumber: 1001, status: 'asteptare_oferta' },
        { _id: '2', orderNumber: 1002, status: 'ofertat' }
      ];
      
      Order.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockOrders)
      });
      Order.countDocuments.mockResolvedValue(2);

      // Act
      const response = await request(app)
        .get('/api/orders?page=1&limit=10')
        .set('Authorization', 'Bearer admintoken');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter orders by status', async () => {
      // Arrange
      Order.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      });
      Order.countDocuments.mockResolvedValue(0);

      // Act
      const response = await request(app)
        .get('/api/orders?status=ofertat')
        .set('Authorization', 'Bearer admintoken');

      // Assert
      expect(Order.find).toHaveBeenCalledWith({ status: 'ofertat' });
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('should update order status successfully', async () => {
      // Arrange
      const mockOrder = {
        _id: 'order123',
        orderNumber: 1001,
        userId: 'user123'
      };
      
      Order.findByIdAndUpdate.mockResolvedValue(mockOrder);
      Notification.create.mockResolvedValue({});

      // Act
      const response = await request(app)
        .put('/api/orders/order123/status')
        .set('Authorization', 'Bearer admintoken')
        .send({ status: 'ofertat' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(
        'order123',
        { status: 'ofertat' },
        { new: true, runValidators: true }
      );
    });

    it('should return 400 for invalid status', async () => {
      // Act
      const response = await request(app)
        .put('/api/orders/order123/status')
        .set('Authorization', 'Bearer admintoken')
        .send({ status: 'invalid_status' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Status invalid');
    });
  });

  describe('POST /api/orders/:id/comments', () => {
    it('should add comment to order', async () => {
      // Arrange
      const mockOrder = {
        _id: 'order123',
        comments: [],
        save: vi.fn().mockResolvedValue()
      };
      mockOrder.comments.push = vi.fn();
      
      Order.findById.mockResolvedValue(mockOrder);

      const mockUser = {
        role: 'user',
        userType: 'persoana_fizica',
        firstName: 'John',
        lastName: 'Doe'
      };

      // Act
      const response = await request(app)
        .post('/api/orders/order123/comments')
        .set('Authorization', 'Bearer usertoken')
        .send({ text: 'This is a test comment' });

      // Assert
      expect(response.status).toBe(200);
      expect(mockOrder.comments.push).toHaveBeenCalled();
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should return 400 for empty comment', async () => {
      // Act
      const response = await request(app)
        .post('/api/orders/order123/comments')
        .set('Authorization', 'Bearer usertoken')
        .send({ text: '' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('obligatoriu');
    });
  });

  describe('GET /api/orders/export', () => {
    it('should export orders as CSV', async () => {
      // Arrange
      const mockOrders = [
        {
          orderNumber: 1001,
          userType: 'persoana_fizica',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phoneNumber: '0721234567',
          status: 'ofertat'
        }
      ];
      
      Order.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockOrders)
      });

      // Act
      const response = await request(app)
        .get('/api/orders/export?format=csv')
        .set('Authorization', 'Bearer admintoken');

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/octet-stream');
    });

    it('should return 400 for unsupported format', async () => {
      // Act
      const response = await request(app)
        .get('/api/orders/export?format=pdf')
        .set('Authorization', 'Bearer admintoken');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('nu este suportat');
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should delete order successfully', async () => {
      // Arrange
      Order.findByIdAndDelete.mockResolvedValue({ _id: 'order123' });

      // Act
      const response = await request(app)
        .delete('/api/orders/order123')
        .set('Authorization', 'Bearer admintoken');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('ștearsă cu succes');
    });

    it('should return 404 if order not found', async () => {
      // Arrange
      Order.findByIdAndDelete.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .delete('/api/orders/nonexistent')
        .set('Authorization', 'Bearer admintoken');

      // Assert
      expect(response.status).toBe(404);
    });
  });
});

describe('OrderValidator', () => {
  describe('validateCreateOrder', () => {
    it('should validate email format', () => {
      expect(() => {
        OrderValidator.validateCreateOrder({
          userType: 'persoana_fizica',
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          phoneNumber: '0721234567',
          carMake: 'Ford',
          carModel: 'Focus',
          carYear: 2020,
          partDetails: 'Test'
        });
      }).toThrow('Email valid este obligatoriu');
    });

    it('should validate phone number', () => {
      expect(() => {
        OrderValidator.validateCreateOrder({
          userType: 'persoana_fizica',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phoneNumber: '123',
          carMake: 'Ford',
          carModel: 'Focus',
          carYear: 2020,
          partDetails: 'Test'
        });
      }).toThrow('Număr de telefon valid');
    });

    it('should validate car year', () => {
      expect(() => {
        OrderValidator.validateCreateOrder({
          userType: 'persoana_fizica',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phoneNumber: '0721234567',
          carMake: 'Ford',
          carModel: 'Focus',
          carYear: 1800,
          partDetails: 'Test'
        });
      }).toThrow('An valid');
    });
  });
});

describe('OrderService', () => {
  describe('buildFilters', () => {
    it('should build filters correctly', () => {
      const filters = OrderService.buildFilters({
        status: 'ofertat',
        orderNumber: '1001',
        phoneNumber: '0721234567'
      });

      expect(filters).toEqual({
        status: 'ofertat',
        orderNumber: '1001',
        phoneNumber: { $regex: '0721234567', $options: 'i' }
      });
    });

    it('should handle date filtering', () => {
      const filters = OrderService.buildFilters({
        selectedDate: '2024-01-15'
      });

      expect(filters.orderDate).toHaveProperty('$gte');
      expect(filters.orderDate).toHaveProperty('$lte');
    });
  });
});