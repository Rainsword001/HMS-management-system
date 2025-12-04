import jwt from 'jsonwebtoken';



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