import express from 'express';
import { deleteUser, updateUser, getAuthenticatedUser  } from '../controllers/UserController.js';
import { verifyToken } from '../utils/verifyToken.js';

const router = express.Router();

router.put('/update/:id', verifyToken, updateUser);
router.delete('/delete/:id', verifyToken, deleteUser);
router.get("/me", verifyToken, getAuthenticatedUser);


export default router;