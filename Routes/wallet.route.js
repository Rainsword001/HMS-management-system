import { Router } from "express";
import {
  initializePayment,
  verifyPayment,
  handleWebhook,
  getBalance,
  getTransactions,
  getVirtualAccount
} from '../services/wallet.service.js';
import { protectPatient } from "../Middlewares/auth.middlewares.js";




const walletRouter = Router();


// Webhook (no auth)
walletRouter.post('/webhook', handleWebhook);

// Patient routes
walletRouter.use(protectPatient);
walletRouter.get('/balance', getBalance);
walletRouter.get('/transactions', getTransactions);
walletRouter.get('/virtual-account', getVirtualAccount);
walletRouter.post('/fund', initializePayment);
walletRouter.get('/verify/:reference', verifyPayment);


export default walletRouter;