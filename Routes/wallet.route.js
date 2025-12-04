import { Router } from "express";
import { createWallet } from "../Controllers/wallet.controller.js";

const walletRouter = Router();


walletRouter.post('/add-funds', createWallet);

export default walletRouter;