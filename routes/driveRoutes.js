import express from "express";
import {
  getSemesters,
  getSubjects,
  getResources,
} from "../controllers/driveController.js";

const router = express.Router();

router.get("/", getSemesters);

router.get("/:semester", getSubjects);

router.get("/:semester/:subject", getResources);

export default router;
