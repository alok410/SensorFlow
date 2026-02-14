import express from "express";
import {
  createSecretary,
  getAllSecretaries,
  getMyProfile,
  updateSecretary,
  deleteSecretary,
} from "../controllers/secretary.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/* ADMIN ONLY */
router.post("/", protect, authorize("admin"), createSecretary);
router.get("/", protect, authorize("admin"), getAllSecretaries);
router.put("/:id", protect, authorize("admin"), updateSecretary);
router.delete("/:id", protect, authorize("admin"), deleteSecretary);

/* SECRETARY ONLY */
router.get("/me", protect, authorize("secretary"), getMyProfile);

export default router;
