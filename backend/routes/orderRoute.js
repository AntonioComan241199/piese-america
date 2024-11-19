import express from 'express';
import {
    createOrder,
    getAllOrders,
    getClientOrders,
    updateOrderStatus,
    deleteOrder,
} from '../controllers/orderController.js'; // Import explicit pentru ES Modules
import authMiddleware from '../middleware/authMiddleware.js'; // Import implicit pentru middleware

const router = express.Router();

// Rute
router.post('/', createOrder); // Creare comandă (fără autentificare)
router.get('/admin', authMiddleware, getAllOrders); // Vizualizare toate comenzile (doar pentru admin)
router.get('/client', authMiddleware, getClientOrders); // Vizualizare comenzile clientului
router.patch('/:id', authMiddleware, updateOrderStatus); // Actualizare status comandă
router.delete('/:id', authMiddleware, deleteOrder); // Ștergere comandă

export default router;
