import { Router } from "express";
import { signUp , signIn, signOut} from "../Controllers/auth.controller.js";
import { verifyToken, authorizeRole } from "../Middlewares/auth.middlewares.js";



const authrouter = Router();

authrouter.post('/register', verifyToken, authorizeRole("admin"), signUp);
authrouter.post('/signin', signIn);
authrouter.post('/signout', signOut);

export default authrouter;

