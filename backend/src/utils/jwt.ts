import jwt from 'jsonwebtoken'
import { env } from '../config/env'

interface TokenPayload {
    userId: number;
}

const ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET!;

// Generate token
export const generateAccessToken = (userId : number) : string => {
    return jwt.sign(
        {userId},
        ACCESS_TOKEN_SECRET,
        {expiresIn: env.ACCESS_TOKEN_EXPIRY}
    );
}
export const generateRefreshToken = (userId : number) : string => {
    return jwt.sign(
        {userId},
        REFRESH_TOKEN_SECRET,
        {expiresIn: env.REFRESH_TOKEN_EXPIRY}
    );
}

// Verify token
export const verifyAccessToken = (token: string): TokenPayload => {
    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        
        if (typeof decoded === 'string' || !('userId' in decoded)) {
            throw new Error('Invalid token payload');
        }
        
        return decoded as TokenPayload;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Access token expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid access token');
        }
        throw error;
    }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    try {
        const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
        
        if (typeof decoded === 'string' || !('userId' in decoded)) {
            throw new Error('Invalid token payload');
        }
        
        return decoded as TokenPayload;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Refresh token expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid refresh token');
        }
        throw error;
    }
};