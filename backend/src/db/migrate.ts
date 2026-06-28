import { drizzle } from "drizzle-orm/postgres-js"
import { env } from "../config/env"
import postgres from "postgres"
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { error } from "node:console";

const runMigration = async () => {
    const client = postgres(env.DATABASE_URL, {max: 1});
    const db = drizzle(client);

    console.log("running migration...");

    await migrate(db, {
        migrationsFolder: "./src/db/migrations",
    })

    console.log("Migration end");
    client.end()
}

runMigration().catch((error) => {
    console.error("migration failed: ", error);
    process.exit(1);
})