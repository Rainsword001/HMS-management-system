import express from 'express';
import { monnifyWebhookHandler } from '../Controllers/webhook.controller.js';
import { initFundWallet } from '../Controllers/walletTransaction.js';
import { verifyToken, authorizeRole } from '../Middlewares/auth.middlewares.js';

const paymentRouter = express.Router();

// Monnify Webhook Route - No authentication
paymentRouter.post('/wallet/init', authorizeRole, initFundWallet);

// Monnify Webhook Route - No authentication
paymentRouter.post("/webhook/monnify", express.json({ verify: (req,res,buf) => { req.rawBody = buf; } }), monnifyWebhookHandler);