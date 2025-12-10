import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';
import Patient from '../models/patient.js'



// Authentication Middleware
export const verifyToken = (req, res, next) => {
    let token;
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
        
    }
    token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        
    }
}


// Authorization Middleware

export const authorizeRole = (...allowedRoles) =>{
    return (req, res, next) => {
        if(!allowedRoles.includes(req.user.role)){
            return res.status(403).json({message: 'Forbidden: You do not have the required permissions'});
        }
        next();
    }
}


//Patient Authenthication
export const protectPatient = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 401, 'Not authorized. Please login.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const patient = await Patient.findById(decoded.id);
    if (!patient) {
      return sendError(res, 401, 'Patient account not found.');
    }

    req.patient = patient;
    next();
  } catch (error) {
    return sendError(res, 401, 'Invalid token. Please login again.');
  }
};