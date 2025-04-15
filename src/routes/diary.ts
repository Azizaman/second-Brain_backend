import express from 'express';
import { Router } from 'express';
const router=Router();
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';



const DiaryEntrySchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    
    mood: {
      type: String,
      enum: ["happy", "sad", "neutral", "excited", "angry"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const DiaryEntry = mongoose.model("DiaryEntry", DiaryEntrySchema);



router.post("/", async (req, res) => {
    try {
      const {  title, content, mood } = req.body;
      const authHeader = req.headers.authorization;
          if (!authHeader) {
            return res.status(401).json({ message: "Access denied, no token provided" });
          }
      
          const token = authHeader.split(" ")[1]; // Extract the token part
      
          if (!token) {
            return res.status(401).json({ message: "Access denied, no token provided" });
          }
      
          // Verify the token and assert the correct type for decoded payload
          const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload; // Type assertion
          const {googleId} = decoded; 
      
  
      const newEntry = new DiaryEntry({
        googleId,
        title,
        content,
        
        mood,
      });
  
      await newEntry.save();
      res.status(201).json({
        message:'Diary created successfully',newEntry
      });
    } catch (error) {
      res.status(500).json({ error: `Failed to create diary entry.${error}`});
    }
  });


  router.get('/',async(req,res)=>{
    try{
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "Access denied, no token provided" });
      }
  
      const token = authHeader.split(" ")[1]; // Extract the token part
  
      if (!token) {
        return res.status(401).json({ message: "Access denied, no token provided" });
      }
  
      // Verify the token and assert the correct type for decoded payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload; // Type assertion
      const {googleId} = decoded; 
      
      const entries=await DiaryEntry.find({googleId}).sort({createdAt:-1});
      res.status(200).json(entries);
    }
    catch(error){
      res.json({message:'error fetching the diary entries',error});
    }
  })

  



  router.get("/:_id", async (req, res) => {
    try {

      const { _id } = req.params;
      const entries = await DiaryEntry.find({ _id }).sort({ createdAt: -1 });
  
      res.status(200).json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch diary entries." });
    }
  });


  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
  
      const updatedEntry = await DiaryEntry.findByIdAndUpdate(
        id,
        { ...updatedData, updatedAt: Date.now() },
        { new: true }
      );
  
      if (!updatedEntry) {
        return res.status(404).json({ error: "Entry not found." });
      }
  
      res.status(200).json(updatedEntry);
    } catch (error) {
      res.status(500).json({ error: "Failed to update diary entry." });
    }
  });
  
  
  
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      const deletedEntry = await DiaryEntry.findByIdAndDelete(id);
  
      if (!deletedEntry) {
        return res.status(404).json({ error: "Entry not found." });
      }
  
      res.status(200).json({ message: "Diary entry deleted." });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete diary entry." });
    }
  });
  
  export default router;
