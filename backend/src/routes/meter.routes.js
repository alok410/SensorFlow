// routes/meter.routes.js
import express from "express";
import { fetchAndStoreMeterData } from "../controllers/meter.controller.js";

const router = express.Router();

router.get("/fetch-meter-data", fetchAndStoreMeterData);

export default router;