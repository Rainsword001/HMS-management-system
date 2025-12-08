import express from 'express'
import {Router} from 'express'
import Wallet from '../models/wallet.js'
import Transaction from '../models/transaction.model.js'
import PaymentService from '../services/paystack.service.js'



const webhookRoute = Router();

webhookRoute.post('/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  if (!PaymentService.verifyWebhookSignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;
  if (event.event === 'charge.success') {
    const { reference, amount } = event.data;
    const transaction = await Transaction.findOne({ reference });
    
    if (transaction && transaction.status === 'pending') {
      transaction.status = 'success';
      await transaction.save();
      await Wallet.findByIdAndUpdate(transaction.walletId, { $inc: { balance: amount / 100 } });
    }
  }

  res.sendStatus(200);
});


export default webhookRoute;




