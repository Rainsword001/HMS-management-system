import express from "express";
import { DB } from "./database/db.js";
import { PORT } from "./config/env.js";
import authrouter from "./Routes/auth.route.js";
import patientRouter from "./Routes/patient.route.js";
import prescriptionRouter from "./Routes/patient.route.js";
import walletRouter from "./Routes/wallet.route.js";
import bodyParser from "body-parser";

import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//Middlewares
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const allowedOrigins = [
  "https://hms-management-system-ae3n.onrender.com",
  "https://hackathon-project-deploy.vercel.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


//Routes
app.use("/api/v1/auth", authrouter);
app.use("/api/v1/patients", patientRouter);
app.use("/api/v1/prescriptions", prescriptionRouter);
app.use("/api/v1/wallets", walletRouter);



app.listen(PORT, async () => {
  await DB();
  console.log("server is running");
});
