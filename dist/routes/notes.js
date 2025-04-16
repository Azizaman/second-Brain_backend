var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Router } from 'express';
import { PrismaClient } from "@prisma/client";
import authenticateToken from '../middleware/authmiddleware.js';
import jwt from "jsonwebtoken";
const router = Router();
const prisma = new PrismaClient();
// Fetch all notes for a specific user
router.get('/', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "Access denied, no token provided" });
        }
        const token = authHeader.split(" ")[1]; // Extract the token part
        if (!token) {
            return res.status(401).json({ message: "Access denied, no token provided" });
        }
        // Verify the token and assert the correct type for decoded payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Type assertion
        const { googleId } = decoded; // Now TypeScript knows googleId is a string
        // Fetch notes belonging to the logged-in user
        const notes = yield prisma.notes.findMany({
            where: { googleId },
        });
        res.status(200).json({ message: "Notes fetched successfully", notes });
    }
    catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ message: "Error fetching notes", error });
    }
}));
// Create a note for a specific user
router.post('/', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, content } = req.body;
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "Access denied, no token provided" });
        }
        const token = authHeader.split(" ")[1]; // Extract the token part
        if (!token) {
            return res.status(401).json({ message: "Access denied, no token provided" });
        }
        // Verify the token and assert the correct type for decoded payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Type assertion
        const { googleId } = decoded; // Now TypeScript knows googleId is a string
        if (!title || !content) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (!googleId) {
            return res.status(400).json({ message: "User not authenticated or googleId missing" });
        }
        const user = yield prisma.user.findUnique({
            where: { googleId },
        });
        if (!user) {
            throw new Error("User not found. Cannot create a note for a non-existent user.");
        }
        // Create a new note associated with the logged-in user
        const note = yield prisma.notes.create({
            data: {
                title: title,
                content: content,
                googleId,
            },
        });
        res.status(201).json({ message: "Note created successfully", note });
    }
    catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ message: "Error creating note", error });
    }
}));
export default router;
