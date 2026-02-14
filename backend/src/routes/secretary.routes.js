import express from "express";
import {
  createSecretary,
  getAllSecretaries,
  getSecretaryById,
  updateSecretary,
  deleteSecretary,
} from "../controllers/seceratary.controller.js";

const router = express.Router();

router.post("/", createSecretary);
router.get("/", getAllSecretaries);
router.get("/:id", getSecretaryById);
router.put("/:id", updateSecretary);
router.delete("/:id", deleteSecretary);

export default router;
