import express from 'express'
import { DB } from './database/db.js';
import { PORT } from './config/env.js';
import authrouter from './Routes/auth.route.js';
import patientRouter from './Routes/patient.route.js';
import prescriptionRouter from './Routes/patient.route.js';
import walletRouter from './Routes/wallet.route.js';
import paystackRouter from './Routes/paystack.route.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// Middlewares
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({
    origin: ['http://localhost:5000'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Routes
app.use('/api/v1/auth', authrouter);
app.use('/api/v1/patients', patientRouter);
app.use('/api/v1/prescriptions', prescriptionRouter);
app.use('/api/v1/wallets', walletRouter);
app.use('/api/v1/hms/pay', paystackRouter);

const startServer = async () => {
    try {
        await DB(); // Connect to MongoDB FIRST
        app.listen(PORT, () => {
            console.log(`Server is running`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
