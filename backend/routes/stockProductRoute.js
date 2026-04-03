import express from 'express';
import { getAll, getOne, create, update, remove, importCSV } from '../controllers/stockProductController.js';
import { verifyToken } from '../utils/verifyToken.js';
import upload from '../middleware/multerConfig.js';

const router = express.Router();

// Public
router.get('/', getAll);
router.get('/:id', getOne);

// Admin only (protejat cu verifyToken)
router.post('/import', verifyToken, importCSV);
router.post('/', verifyToken, upload.single('image'), create);
router.put('/:id', verifyToken, upload.single('image'), update);
router.delete('/:id', verifyToken, remove);

export default router;