import express from 'express'
import {DB} from './database/db.js';
import { PORT } from './config/env.js';
import authrouter from './Routes/auth.route.js';
import patientRouter from './Routes/patient.route.js';
import prescriptionRouter from './Routes/patient.route.js';
import walletRouter from './Routes/wallet.route.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();

//Middlewares
app.use(cookieParser());
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(cors({
    origin: ['http://localhost:5000', 'https://hms-management-system-scab.onrender.com'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

//Routes
app.use('/api/v1/auth', authrouter);
app.use('/api/v1/patients', patientRouter);
app.use('/api/v1/prescriptions', prescriptionRouter);
app.use('/api/v1/wallets', walletRouter);








app.listen(PORT, () =>{
    DB();
    console.log('server is running')
})