import express from 'express';
import { google, signup, signin, signOut, refreshToken } from '../controllers/authController.js';


const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post("/refresh-token", refreshToken);
//router.post('/google', google);
router.get('/signout', signOut);


export default router;