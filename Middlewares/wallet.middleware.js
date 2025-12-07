import jwt from "jsonwebtoken"
import Patient from "../models/patient.js"



export const authenticationPatient = async (req, res, next) =>{
    try {
        const token = req.header('Authorization')?.replace('Bearer', '')

        if(!token){
            return res.status(401).json({message: 'Authentication required'});
        
        }

         const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const patient = await Patient.findById(decoded.id);

    if (!patient) {
      return res.status(401).json({ error: 'Patient not found' });
    }

    req.patient = patient;
    req.patientId = patient._id;
    next();
        
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}



export const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check admin role from your admin/staff collection
    const Admin = require('../models/Admin'); // or Staff model
    const admin = await Admin.findById(decoded.id);

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.admin = admin;
    req.adminId = admin._id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

