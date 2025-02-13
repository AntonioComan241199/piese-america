import express from 'express';
import { getRealtimeStats, getReports } from '../controllers/reportController.js';
import { verifyToken } from '../utils/verifyToken.js';

const router = express.Router();

// Rută pentru statistici în timp real
router.get('/realtime', verifyToken, getRealtimeStats);

// Rută pentru istoricul rapoartelor
router.get('/', verifyToken, getReports);

export default router;