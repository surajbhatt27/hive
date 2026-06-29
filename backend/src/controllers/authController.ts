import { Request, Response } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { env } from "../config/env";

export const register = async (req: Request, res: Response) => {
    try {
    const {name, email, password} = req.body;

    if(!name || !email || !password) {
        return res.status(400).json({message: "All fields are required"});
    }

    const existedUser = await db.select().from(users).where(eq(users.email, email))
    if(existedUser.length > 0) {
        return res.status(400).json({message: "User already exists"});
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = await db.insert(users).values({
        name,
        email,
        password: hashedPass
    }).returning();

    const accessToken = generateAccessToken(newUser[0].id);
    const refreshToken = generateRefreshToken(newUser[0].id);

    const { password:_, ...userWithoutPassword } = newUser[0];

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
    });

    return res.status(201).json({
        user: userWithoutPassword,
        accessToken,
    });
    } catch (error) {
        return res.status(500).json({message: "Registration failed"});
    }
};

export const login = async (req: Request, res: Response) => {
    try {
    const {email, password} = req.body;

    if(!email || !password) {
        return res.status(400).json({message: "email and Password is required"});
    }

    const user = await db.select().from(users).where(eq(users.email, email));
    if(user.length == 0) {
        return res.status(400).json({message: "Invalid credentials"});
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if(!isMatch) {
        return res.status(400).json({message: "Invalid credentials"});
    }

    const accessToken = generateAccessToken(user[0].id)
    const refreshToken = generateRefreshToken(user[0].id)

    const {password:_, ...userWithoutPassword} = user[0];

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
    })
    
    return res.json({
        user: userWithoutPassword,
        accessToken,
    });
    } catch (error) {
        return res.status(401).json({message: "Invalid refresh token"});
    }

}

export const refresh = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if(!refreshToken) {
            return res.status(400).json({message: "Refresh token required"});
        }

        const decoded = verifyRefreshToken(refreshToken);
        const user = await db.select().from(users).where(eq(users.id, decoded.userId));

        if(user.length === 0) {
            return res.status(404).json({message: "user not found"});
        }

        const accessToken = generateAccessToken(decoded.userId);
        return res.json({accessToken});
    } catch (error) {
        return res.status(401).json({message: "Invalid refresh token"})
    }
}

export const getMe = async (req: Request, res: Response) => {
    try {
        const user = await db.select().from(users).where(eq(users.id, req.userId!));
        if(user.length===0) {
            return res.status(404).json({message: "User not found"})
        }

        const {password:_, ...userWithoutPassword} = user[0];
        return res.json({userWithoutPassword});
    } catch (error) {
        return res.status(500).json({message: "Failed to get user"});
    }
}

export const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/auth',
        })
        return res.json({message: "Logged out successfully"});
    } catch (error) {
        return res.status(500).json({message: 'Logout failed'});
    }
}