import express from 'express';
import { login } from '../controllers/auth.controller.js';
import { getMe } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);


export default router;
