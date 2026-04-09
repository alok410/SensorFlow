import express from "express";
import {
  createConsumer,
  getAllConsumers,
  updateConsumer,
  deleteConsumer,
  getConsumerById,
} from "../controllers/consumer.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();


router.post("/", protect, authorize("admin"), createConsumer);

router.get("/", protect, authorize("admin" , "secretary"), getAllConsumers);

router.put("/:id", protect, authorize("admin"), updateConsumer);

router.delete("/:id", protect, authorize("admin"), deleteConsumer);

router.get("/:id", protect, authorize("admin", "secretary"), getConsumerById);  

export default router;
