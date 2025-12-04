import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs';
import Staff from '../models/staff.model.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';


// Sign Up Controller
export const signUp = async (req, res, next) =>{
    try {
        const {name, email, password, role} = req.body;
        //validate users input
        if(!name || !email || !password || !role){
            return res.status(400).json({
                message: "All fields are required"
            })
        }
        //validate if exist user
        const existUser = await Staff.findOne({email});

        if(existUser){
            return res.status(400).json({
                message: "User already exit"
            })
        };
        //hash password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        //create new user
        const newStaff = new Staff({name, email, 
            password: hashPassword, 
            role
        });

        await newStaff.save();
        return res.status(201).json({
            message: "User created successfully",
        })
    } catch (error) {
         console.error("Signup Error:", error);
        return res.status(500).json({
                message: "Internal server error",
        });
    }
}


//Sign In Controller
export const signIn = async (req, res, next) =>{
    try {
        const {email, password} = req.body;
        //validate users input
        if(!email || !password){
            return res.status(400).json({
                message: "All fields are required"
            })
        }
        //check if user exist
        const staff = await Staff.findOne({email});

        if(!staff){
            return res.status(400).json({
                message: "User does not exist"
            })
        };

        //check password
        const isMatch = await bcrypt.compare(password, staff.password);
        if(!isMatch){
            return res.status(400).json({
                message: "Invalid credentials"
            })
        };

        // Generate JWt Token
        const token = jwt.sign(
            {staffId: staff._id, email, role: staff.role},
            JWT_SECRET,
            {
                expiresIn: JWT_EXPIRES_IN
            }
        );  
        return res.status(200).json({
            message: "Signin successful",
            token,
            status: staff.status,
            role: staff.role
        })
    } catch (error) {
         console.error("Signin Error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }   
}


//signout controller
export const signOut = async (req, res, next) =>{
    try {
        res.clearCookie('token');
        return res.status(200).json({
            message: "Signout successful"
        })
    } catch (error) {
         console.error("Signout Error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}