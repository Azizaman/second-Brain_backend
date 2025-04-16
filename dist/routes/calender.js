var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoose from "mongoose";
import { Router } from "express";
import jwt from "jsonwebtoken";
const router = Router();
// Event Schema
const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    googleId: { type: String, required: true },
});
const Event = mongoose.model("Event", eventSchema);
// Routes
// Get all events
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Invalid Authorization header format" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { googleId } = decoded;
        const events = yield Event.find({ googleId });
        res.status(200).json(events);
    }
    catch (err) {
        console.error('Error during route execution:', err.message);
        if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            return res.status(403).json({ message: "Invalid or expired token" });
        }
        res.status(500).json({ error: "Error fetching events" });
    }
}));
// Create a new event
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        console.log('Authorization header:', authHeader);
        if (!authHeader) {
            return res.status(401).json({ message: "Access denied, no authheader provided" });
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Access denied, no token provided" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { googleId } = decoded;
        const { title, start, end } = req.body;
        const newEvent = new Event({ title, start, end, googleId });
        yield newEvent.save();
        res.status(201).json(newEvent);
    }
    catch (err) {
        res.status(400).json({ error: "Error creating event" });
    }
}));
// Update an event
router.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "Access denied, no token provided" });
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Access denied, no token provided" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { googleId } = decoded;
        const { id } = req.params;
        const { title, start, end } = req.body;
        const event = yield Event.findById(id);
        if (!event || event.googleId !== googleId) {
            return res.status(404).json({ error: "Event not found or unauthorized" });
        }
        const updatedEvent = yield Event.findByIdAndUpdate(id, { title, start, end }, { new: true });
        res.status(200).json(updatedEvent);
    }
    catch (err) {
        res.status(400).json({ error: "Error updating event" });
    }
}));
// Delete an event
router.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const event = yield Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: "Event not found or unauthorized" });
        }
        yield Event.deleteOne({ _id: id });
        res.status(200).json({ message: "Event deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ error: "Error deleting event" });
    }
}));
export default router;
