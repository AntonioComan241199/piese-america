import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderService } from '../services/orderService.js';
import Order from '../models/Order.js';
import Counter from '../models/Counter.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

// Mock-uri
vi.mock('../models/Order.js');
vi.mock('../models/Counter.js');

describe('OrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateOrderNumber', () => {
    it('should generate next order number', async () => {
      // Arrange
      Counter.findOneAndUpdate.mockResolvedValue({ value: 1001 });

      // Act
      const orderNumber = await OrderService.generateOrderNumber();

      // Assert
      expect(orderNumber).toBe(1001);
      expect(Counter.findOneAndUpdate).toHaveBeenCalledWith(
        { name: 'orderNumber' },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
    });
  });

  describe('buildFilters', () => {
    it('should build basic filters', () => {
      // Act
      const filters = OrderService.buildFilters({
        status: 'ofertat',
        orderNumber: '1001',
        userId: 'user123'
      });

      // Assert
      expect(filters).toEqual({
        status: 'ofertat',
        orderNumber: '1001',
        userId: 'user123'
      });
    });

    it('should build phone number regex filter', () => {
      // Act
      const filters = OrderService.buildFilters({
        phoneNumber: '0721234567'
      });

      // Assert
      expect(filters.phoneNumber).toEqual({
        $regex: '0721234567',
        $options: 'i'
      });
    });

    it('should build date range filter', () => {
      // Arrange
      const testDate = '2024-01-15';

      // Act
      const filters = OrderService.buildFilters({
        selectedDate: testDate
      });

      // Assert
      expect(filters.orderDate).toHaveProperty('$gte');
      expect(filters.orderDate).toHaveProperty('$lte');
      expect(new Date(filters.orderDate.$gte).getHours()).toBe(0);
      expect(new Date(filters.orderDate.$lte).getHours()).toBe(23);
    });
  });

  describe('getOrdersWithPagination', () => {
    it('should return orders with pagination', async () => {
      // Arrange
      const mockOrders = [
        { _id: '1', orderNumber: 1001 },
        { _id: '2', orderNumber: 1002 }
      ];
      
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockOrders)
      };
      
      Order.find.mockReturnValue(mockQuery);
      Order.countDocuments.mockResolvedValue(25);

      // Act
      const result = await OrderService.getOrdersWithPagination(
        { status: 'ofertat' },
        { page: 2, limit: 10 }
      );

      // Assert
      expect(result.orders).toEqual(mockOrders);
      expect(result.pagination).toEqual({
        total: 25,
        page: 2,
        pages: 3
      });
      expect(mockQuery.skip).toHaveBeenCalledWith(10);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      // Arrange
      Counter.findOneAndUpdate.mockResolvedValue({ value: 1001 });
      const mockSave = vi.fn().mockResolvedValue({
        orderNumber: 1001,
        userId: 'user123'
      });
      
      Order.mockImplementation(() => ({
        save: mockSave
      }));

      const orderData = {
        userType: 'persoana_fizica',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };

      // Act
      const result = await OrderService.createOrder(orderData, 'user123');

      // Assert
      expect(mockSave).toHaveBeenCalled();
      expect(result.orderNumber).toBe(1001);
    });
  });

  describe('findOrderById', () => {
    it('should find order by id', async () => {
      // Arrange
      const mockOrder = { _id: 'order123', orderNumber: 1001 };
      const mockQuery = {
        populate: vi.fn().mockReturnThis()
      };
      mockQuery.populate.mockResolvedValue(mockOrder);
      Order.findById.mockReturnValue(mockQuery);

      // Act
      const result = await OrderService.findOrderById('order123');

      // Assert
      expect(result).toEqual(mockOrder);
      expect(Order.findById).toHaveBeenCalledWith('order123');
    });

    it('should throw NotFoundError when order not found', async () => {
      // Arrange
      const mockQuery = {
        populate: vi.fn().mockReturnThis()
      };
      mockQuery.populate.mockResolvedValue(null);
      Order.findById.mockReturnValue(mockQuery);

      // Act & Assert
      await expect(OrderService.findOrderById('nonexistent'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      // Arrange
      const mockOrder = { _id: 'order123', status: 'ofertat' };
      Order.findByIdAndUpdate.mockResolvedValue(mockOrder);

      // Act
      const result = await OrderService.updateOrderStatus('order123', 'ofertat');

      // Assert
      expect(result).toEqual(mockOrder);
      expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(
        'order123',
        { status: 'ofertat' },
        { new: true, runValidators: true }
      );
    });

    it('should throw ValidationError for invalid status', async () => {
      // Act & Assert
      await expect(OrderService.updateOrderStatus('order123', 'invalid'))
        .rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when order not found', async () => {
      // Arrange
      Order.findByIdAndUpdate.mockResolvedValue(null);

      // Act & Assert
      await expect(OrderService.updateOrderStatus('order123', 'ofertat'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserDisplayName', () => {
    it('should return "Admin" for admin role', () => {
      // Arrange
      const user = { role: 'admin' };

      // Act
      const result = OrderService.getUserDisplayName(user);

      // Assert
      expect(result).toBe('Admin');
    });

    it('should return full name for physical person', () => {
      // Arrange
      const user = {
        role: 'user',
        userType: 'persoana_fizica',
        firstName: 'John',
        lastName: 'Doe'
      };

      // Act
      const result = OrderService.getUserDisplayName(user);

      // Assert
      expect(result).toBe('John Doe');
    });

    it('should return company name for legal entity', () => {
      // Arrange
      const user = {
        role: 'user',
        userType: 'persoana_juridica',
        companyDetails: { companyName: 'Test Company SRL' }
      };

      // Act
      const result = OrderService.getUserDisplayName(user);

      // Assert
      expect(result).toBe('Test Company SRL');
    });

    it('should return "Client" as fallback', () => {
      // Arrange
      const user = { role: 'user' };

      // Act
      const result = OrderService.getUserDisplayName(user);

      // Assert
      expect(result).toBe('Client');
    });
  });

  describe('addComment', () => {
    it('should add comment to order', async () => {
      // Arrange
      const mockOrder = {
        _id: 'order123',
        comments: [],
        save: vi.fn().mockResolvedValue()
      };
      mockOrder.comments.push = vi.fn();
      Order.findById.mockResolvedValue(mockOrder);

      const user = {
        role: 'user',
        userType: 'persoana_fizica',
        firstName: 'John',
        lastName: 'Doe'
      };

      // Act
      const result = await OrderService.addComment('order123', 'Test comment', user);

      // Assert
      expect(mockOrder.comments.push).toHaveBeenCalledWith({
        text: 'Test comment',
        user: 'John Doe'
      });
      expect(mockOrder.save).toHaveBeenCalled();
    });
  });

  describe('exportOrders', () => {
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
        },
        {
          orderNumber: 1002,
          userType: 'persoana_juridica',
          companyDetails: { companyName: 'Test Company' },
          email: 'company@example.com',
          phoneNumber: '0721234568',
          status: 'asteptare_oferta'
        }
      ];

      const mockQuery = {
        populate: vi.fn().mockResolvedValue(mockOrders)
      };
      Order.find.mockReturnValue(mockQuery);

      // Act
      const result = await OrderService.exportOrders();

      // Assert
      expect(result).toContain('OrderNumber,Name,Email,PhoneNumber,Status');
      expect(result).toContain('1001,John Doe,john@example.com,0721234567,ofertat');
      expect(result).toContain('1002,Test Company,company@example.com,0721234568,asteptare_oferta');
    });
  });
});