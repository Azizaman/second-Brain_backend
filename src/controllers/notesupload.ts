
import { Snapshot } from "recoil";
import {db} from "../config/firebase.js";


export const addNote=async (req,res)=>{

    try{
        const { title, content } = req.body;
    const newNote={title,content,createdAt: new Date() }

    const docRef = await db.collection("notes").add(newNote);

    res.status(201).json({ id: docRef.id, ...newNote });

    }
    catch(error){
        console.log("error adding the notes",error);
        res.status(500).json({error:"error adding the notes"});
    }
    
}

export const getNotes=async (req,res)=>
{

    try{
        const snapshot=await db.collection("notes").get();

    const notes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      res.status(200).json(notes);

    }
    catch (error) {
        console.error("Error retrieving notes:", error);
        res.status(500).json({ message: "Error retrieving notes" });
      }
}
