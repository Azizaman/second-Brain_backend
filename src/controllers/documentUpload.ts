import { Request, Response } from 'express';
import supabase from '../config/supabaseClient.js';  // Import the Supabase client
import multer from 'multer';



// below code is for supabase which iam not using 




// Set storage engine to memory storage (we'll use file buffer directly)
const storage = multer.memoryStorage();

// Initialize multer with storage configuration
const upload = multer({ storage: storage });

export const uploadDocument = async (req, res) => {
  try {
    // Check if the file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Extract the file from the request
    const file = req.file;
    const filePath = `documents/${file.originalname}`; // Path where the file will be stored

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('second_brain_pdf')  // Bucket name from Supabase
      .upload(filePath, file.buffer, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files with the same name
      });

    if (error) {
      throw error;
    }

    // Get the public URL for the uploaded file
    const publicUrlData = supabase.storage
      .from('second_brain_pdf')
      .getPublicUrl(filePath);

    // Access the public URL from the 'data' object
    const publicURL = publicUrlData.data.publicUrl;

    return res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl: publicURL, // Now you can use the public URL here
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ message: 'Failed to upload document', error });
  }
};


