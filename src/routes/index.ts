import express from 'express';
import { uploadDocument } from '../controllers/documentUpload.js';
import upload from '../middleware/uploadMiddleware.js';
import { addNote,getNotes } from '../controllers/notesupload.js';

const router = express.Router();

// Define the route for document upload
router.post('/upload', upload.single('file'), uploadDocument);

router.post('/notes',addNote)
router.get('/notes',getNotes);
export default router;
