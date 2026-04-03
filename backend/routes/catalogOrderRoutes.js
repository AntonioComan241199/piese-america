import express from 'express';
import { verifyToken } from '../utils/verifyToken.js';
import { 
  createCatalogOrder, 
  getAdminCatalogOrders, 
  getCatalogOrderById, 
  getUserCatalogOrders,
  updateCatalogOrderStatus,
  updateCatalogOrderItems
} from '../controllers/catalogOrderController.js';

const router = express.Router();

router.post('/', verifyToken, createCatalogOrder);
router.get('/admin', verifyToken, getAdminCatalogOrders);
router.get('/my-orders', verifyToken, getUserCatalogOrders);
router.get('/:id', verifyToken, getCatalogOrderById);
router.patch('/:id', verifyToken, updateCatalogOrderStatus);
router.patch('/:id/items', updateCatalogOrderItems);

export default router;