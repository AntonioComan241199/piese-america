import express from 'express';
import {
    createOrder,
    getAllOrders,
    getClientOrders,
    updateOrderStatus,
    deleteOrder,
    getOrderById,
    addCommentToOrder
} from '../controllers/orderController.js'; // Import explicit pentru ES Modules
import authMiddleware from '../middleware/authMiddleware.js'; // Import implicit pentru middleware

const router = express.Router();

// Rute comenzi
router.post("/create", createOrder); // Ruta pentru crearea comenzilor fără autentificare
router.post("/create", authMiddleware, createOrder);
router.get('/admin', authMiddleware, getAllOrders); // Vizualizare toate comenzile (doar pentru admin)
router.get('/client', authMiddleware, getClientOrders); // Vizualizare comenzile clientului de completat
router.patch('/:id', authMiddleware, updateOrderStatus); // Actualizare status comandă de completat
router.delete('/:id', authMiddleware, deleteOrder); // Ștergere comandă de completat
router.get('/:id', authMiddleware, getOrderById); // Preluare detalii comandă
router.post('/:id/comments', authMiddleware, addCommentToOrder); // Adaugă un comentariu la o comandă


export default router;
