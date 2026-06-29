import dotenv from "dotenv";
import path from 'path';
import jwt from 'jsonwebtoken';

// Load .env file
dotenv.config(({ path: path.resolve(__dirname, '../../.env')}));

const requiredEnvVars = ['DATABASE_URL', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];

requiredEnvVars.forEach((envVar) => {
    if(!process.env[envVar]) {
        throw new Error(`Missing required env variable: ${envVar}`)
    }
});

export const env = {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV || 'development',
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY: (process.env.ACCESS_TOKEN_EXPIRY)as jwt.SignOptions["expiresIn"],
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRY: (process.env.REFRESH_TOKEN_EXPIRY) as jwt.SignOptions["expiresIn"],
}
