// routes/meter.routes.js
import express from "express";
import { storeMeterData } from "../controllers/meter.controller.js";

const router = express.Router();

router.get("/fetch-meter-data", storeMeterData);

export default router;