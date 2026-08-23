import { Router } from "express";
import { getPublicHomepageContent } from "../controllers/siteController.js";

const router = Router();

router.get("/homepage", getPublicHomepageContent);

export default router;
