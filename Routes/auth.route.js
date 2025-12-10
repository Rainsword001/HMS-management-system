import { Router } from "express";
import {
  signUp,
  signIn,
  signOut,
  getAllStaff,
  deactivateStaff,
  activateStaff
} from "../Controllers/auth.controller.js";
import { verifyToken, authorizeRole } from "../Middlewares/auth.middlewares.js";

const authrouter = Router();

authrouter.post("/register", verifyToken, authorizeRole("admin"), signUp);
authrouter.post("/signin", signIn);
authrouter.get("/staffs-list", getAllStaff);
authrouter.patch("/staffs/:staffId/deactivate", deactivateStaff);
authrouter.patch("/staffs/:staffId/activate", activateStaff);
authrouter.post("/signout", signOut);

export default authrouter;
