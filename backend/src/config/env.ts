import dotenv from "dotenv";
import path from 'path';
import jwt from 'jsonwebtoken';

// Load .env file
dotenv.config(({ path: path.resolve(__dirname, '../../.env')}));

const requiredEnvVars = [
    'DATABASE_URL',
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'ACCESS_TOKEN_EXPIRY',
    'REFRESH_TOKEN_EXPIRY',
];

requiredEnvVars.forEach((envVar) => {
    if(!process.env[envVar]) {
        throw new Error(`Missing required env variable: ${envVar}`)
    }
});

// An empty or zero PORT makes Express bind a random port, which the frontend
// (fixed at localhost:3000) can never reach. Fall back to 3000 in that case.
const parsedPort = Number.parseInt(process.env.PORT ?? "", 10);

const envPort = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65535
    ? parsedPort
    : 3000;

export const env = {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: envPort,
    NODE_ENV: process.env.NODE_ENV || 'development',
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
    ACCESS_TOKEN_EXPIRY: (process.env.ACCESS_TOKEN_EXPIRY || '1d')as jwt.SignOptions["expiresIn"],
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
    REFRESH_TOKEN_EXPIRY: (process.env.REFRESH_TOKEN_EXPIRY || '7d') as jwt.SignOptions["expiresIn"],
} as const;
