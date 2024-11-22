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

// Rute comenzi
router.post("/create", authMiddleware, createOrder);
router.get('/admin', authMiddleware, getAllOrders); // Vizualizare toate comenzile (doar pentru admin)
router.get('/client', authMiddleware, getClientOrders); // Vizualizare comenzile clientului de completat
router.patch('/:id', authMiddleware, updateOrderStatus); // Actualizare status comandă de completat
router.delete('/:id', authMiddleware, deleteOrder); // Ștergere comandă de completat

export default router;
