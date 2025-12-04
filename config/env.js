import { config } from "dotenv";


config({path: `.env.${process.env.NODE_ENV || 'development'}.local`})


export const {
    PORT,
    DB_URL,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    PAYSTACK_SECRET_KEY,
    PAYSTACK_BASE_URL
} = process.env
