import { Router } from "express";
import { startPayment, createPayment, getPayment } from "../Controllers/paystack.controller.js";


const paystackRouter = Router()


paystackRouter.post('/', startPayment);
paystackRouter.get('/createPayment', createPayment);
paystackRouter.get('/paymentDetails', getPayment);



export default paystackRouter;