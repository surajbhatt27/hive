import express, { Request, Response } from "express";
import cors from 'cors'
import { env } from "./config/env";
import { checkDatabaseConnection } from "./db";
import authRoutes from './routes/auth'
import cookieParser from "cookie-parser";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json())
app.use(cookieParser());

// Route
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'ok', 
        message: 'Backend is running!',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);

const startServer = async () => {
    await checkDatabaseConnection();

    app.listen(env.PORT, ()=> {
        console.log(`Server running at http://localhost:${env.PORT}`);
        console.log(`Environment: ${env.NODE_ENV}`);
    })
}

startServer().catch(console.error);

export default app;