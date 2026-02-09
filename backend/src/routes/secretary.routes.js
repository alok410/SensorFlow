import express from 'express';
import {
  createSecretary,
  getAllSecretaries,
  getSecretaryById,
  updateSecretary,
  deleteSecretary,
} from '../controllers/secretary.controller.js';

import { protect } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router.post('/', createSecretary);
router.get('/', getAllSecretaries);
router.get('/:id', getSecretaryById);
router.put('/:id', updateSecretary);
router.delete('/:id', deleteSecretary);

export default router;
