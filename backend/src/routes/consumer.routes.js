import express from "express";
import {
  createConsumer,
  getAllConsumers,
  updateConsumer,
  deleteConsumer,
} from "../controllers/consumer.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/* =================================
   ADMIN ONLY ROUTES
=================================*/

// Create Consumer
router.post("/", protect, authorize("admin"), createConsumer);

// Get All Consumers
router.get("/", protect, authorize("admin"), getAllConsumers);

// Update Consumer
router.put("/:id", protect, authorize("admin"), updateConsumer);

// Delete Consumer
router.delete("/:id", protect, authorize("admin"), deleteConsumer);

export default router;
