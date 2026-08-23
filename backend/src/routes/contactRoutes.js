import { Router } from "express";
import { publicContactStatus, requestContactCode, verifyContactCode } from "../controllers/contactController.js";
import { optionalAuthenticateUser } from "../middleware/auth.js";
import { contactLimiter } from "../middleware/security.js";

const router = Router();
router.post("/", contactLimiter, optionalAuthenticateUser, requestContactCode);
router.post("/verify", contactLimiter, optionalAuthenticateUser, verifyContactCode);
router.post("/status", contactLimiter, publicContactStatus);
export default router;
