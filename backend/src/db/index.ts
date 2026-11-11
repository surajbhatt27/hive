import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Connection
const ConnectionString = process.env.DATABASE_URL!;
const client = postgres(ConnectionString);

// Drizzle Instance 
export const db = drizzle(client, { schema });

// Connection check
export async function checkDatabaseConnection () {
    try {
        await client `SELECT 1`
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed: ", error);
        process.exit(1);
    }
}