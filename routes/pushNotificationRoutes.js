import express from "express";
import { registerPushToken, sendPushNotification } from "../controllers/pushNotificationController.js";

const router = express.Router();

// POST endpoint to register an Expo Push Token
router.post("/register", registerPushToken);

// POST endpoint to send notifications to all registered tokens
router.post("/send", sendPushNotification);

export default router;
