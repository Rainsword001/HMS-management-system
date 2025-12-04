// src/routes/paystack.routes.js
import express from "express";
import { paystackWebhookHandler } from "../controllers/paystack.webhook.controller.js";

const router = express.Router();

// Important: capture raw body only for this route
router.post(
  "/webhook/paystack",
  express.json({ verify: (req, res, buf) => { req.rawBody = buf.toString(); } }),
  paystackWebhookHandler
);

export default router;
