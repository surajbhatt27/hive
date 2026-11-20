import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

declare global {
    namespace Express {
        interface Request {
            userId?: number;
        }
    }
}

// Attaches the user when a valid token is present, but lets anonymous requests
// through. Used by public pages (e.g. an invite preview) that personalize
// their response when someone is already signed in.
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        try {
            req.userId = verifyAccessToken(authHeader.slice(7)).userId;
        } catch {
            // An expired token is treated as anonymous.
        }
    }
    next();
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({message: 'No token provided'});
        }
        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({message: 'Invalid or expired token'});
    }
}