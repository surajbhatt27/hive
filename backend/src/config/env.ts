import dotenv from "dotenv";
import path from 'path';

// Load .env file
dotenv.config(({ path: path.resolve(__dirname, '../../.env')}));

const requiredEnvVars = ['DATABASE_URL'];

requiredEnvVars.forEach((envVar) => {
    if(!process.env[envVar]) {
        throw new Error(`Missing required env variable: ${envVar}`)
    }
});

export const env = {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV || 'development'
}
