import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv'
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default {
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
} satisfies Config;