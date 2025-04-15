import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "jsonwebtoken";

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
router.get("/", async (req: any, res) => {
    try {
      const authHeader = req.headers.authorization;
      
  
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Invalid Authorization header format" });
      }
  
      const token = authHeader.split(" ")[1];
      
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      
  
      const { googleId } = decoded;
      
  
      const events = await Event.find({ googleId });
      res.status(200).json(events);
    } catch (err) {
      console.error('Error during route execution:', err.message);
      if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        return res.status(403).json({ message: "Invalid or expired token" });
      }
      res.status(500).json({ error: "Error fetching events" });
    }
  });
  

// Create a new event
router.post("/", async (req: any, res) => {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    const { googleId } = decoded;

    const { title, start, end } = req.body;
    const newEvent = new Event({ title, start, end, googleId });
    await newEvent.save();

    res.status(201).json(newEvent);
  } catch (err) {
    res.status(400).json({ error: "Error creating event" });
  }
});

// Update an event
router.put("/:id", async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Access denied, no token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied, no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    const { googleId } = decoded;

    const { id } = req.params;
    const { title, start, end } = req.body;

    const event = await Event.findById(id);
    if (!event || event.googleId !== googleId) {
      return res.status(404).json({ error: "Event not found or unauthorized" });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { title, start, end },
      { new: true }
    );

    res.status(200).json(updatedEvent);
  } catch (err) {
    res.status(400).json({ error: "Error updating event" });
  }
});

// Delete an event
router.delete("/:id", async (req: any, res) => {
  try {
    

    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event ) {
      return res.status(404).json({ error: "Event not found or unauthorized" });
    }

    await Event.deleteOne({ _id: id });
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting event" });
  }
});

export default router;
