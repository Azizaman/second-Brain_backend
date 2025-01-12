import multer from 'multer';

// Set up multer to store the files in memory (buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export default upload;
