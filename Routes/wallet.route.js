import { Router } from "express";
import { createWallet } from "../Controllers/wallet.controller.js";
import { v4 as uuidv4 } from "uuid";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.model.js"
import Patient from "../models/patient.js";
import PaymentService from "../services/paystack.service.js";
import { verifyToken } from "../Middlewares/auth.middlewares.js";


uuidv4();

const walletRouter = Router();


walletRouter.get('/balance', createWallet);

export default walletRouter;