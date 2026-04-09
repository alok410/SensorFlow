import express from "express";
import { getWaterRate, setWaterRate } from "../controllers/waterRate.controller.js";

const router = express.Router();

router.get("/", getWaterRate);
router.post("/", setWaterRate);

export default router;