import express from 'express';
import { deleteUser, updateUser } from '../controllers/UserController.js';
import { verifyToken } from '../utils/verifyToken.js';

const router = express.Router();

router.put('/update/:id', verifyToken, updateUser);
router.delete('/delete/:id', verifyToken, deleteUser);


export default router;