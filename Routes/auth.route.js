import { Router } from "express";
import {
  signUp,
  signIn,
  signOut,
  getAllStaff,
} from "../Controllers/auth.controller.js";
import { verifyToken, authorizeRole } from "../Middlewares/auth.middlewares.js";
import { authenticateAdmin } from "../Middlewares/wallet.middleware.js";

const authrouter = Router();

authrouter.post("/register", verifyToken, authorizeRole("admin"), signUp);
authrouter.post("/signin", signIn);
authrouter.get("/staffs-list", getAllStaff);
authrouter.post("/signout", signOut);

export default authrouter;
