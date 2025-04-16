var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import pkg from 'pdfjs-dist';
const { getDocument } = pkg;
import Tesseract from "tesseract.js"; // For OCR on images
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import notesrouter from './routes/notes.js';
import passport from 'passport';
import session from 'express-session';
import authrouter from './routes/auth.js';
import { PrismaClient } from "@prisma/client";
import diaryrouter from './routes/diary.js';
import eventsrouter from './routes/calender.js';
import mammoth from "mammoth";
const prisma = new PrismaClient();
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
dotenv.config();
// Constants
const PORT = 5000;
const MONGO_URI = process.env.MONGO_URI;
const AI_MODEL = "gemini-2.0-flash"; // Assuming AI analysis uses this
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL_INSTANCE = new GoogleGenerativeAI(AI_API_KEY).getGenerativeModel({ model: AI_MODEL });
// Initialize Express
const app = express();
app.use(express.json());
app.use(cors());
app.use(cors({
    origin: 'http://localhost:5173', // Replace with your frontend URL
}));
// MongoDB connection
mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
const FileSchema = new mongoose.Schema({
    fileKey: {
        type: String,
        required: true, // Ensure a unique file identifier is always provided
    },
    data: {
        type: Buffer,
        required: false, // Ensure file data is always present
    },
    extractedText: {
        type: String,
        required: true, // Ensure extracted text is always stored
    },
    parsedResponse: {
        type: Object, // For storing AI-generated analysis or summary
        default: {}, // Default to an empty object
    },
    title: {
        type: String,
        required: true, // Title for the file/note
    },
    userId: {
        type: String,
        ref: "User", // Reference the User model
        required: true, // Ensure each file is linked to a user
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the timestamp
    },
}, {
    timestamps: true, // Automatically manage `createdAt` and `updatedAt`
});
const FileModel = mongoose.model("File", FileSchema);
// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });
// Set up session middleware
app.use(session({
    secret: 'your_secret_key', // Replace with a secure secret
    resave: false, // Prevents resaving session if nothing has changed
    saveUninitialized: false, // Only save sessions that are initialized
    cookie: {
        secure: false, // Set true if using HTTPS
        maxAge: 1000 * 60 * 60 * 24, // Session expiration time in milliseconds (e.g., 1 day)
    },
}));
// Passport Google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:5000/auth/google/callback',
    passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!profile.id) {
            throw new Error('Profile ID is missing.');
        }
        let user = yield prisma.user.findUnique({
            where: {
                googleId: profile.id
            }
        });
        if (!user) {
            // Create a new user if not found
            user = yield prisma.user.create({
                data: {
                    googleId: profile.id,
                    email: profile.emails ? profile.emails[0].value : '',
                    name: profile.displayName,
                    avatar: profile.photos ? profile.photos[0].value : '',
                }
            });
        }
        done(null, user); // Successfully authenticated, pass the user
    }
    catch (err) {
        done(err, null);
    }
})));
// Route for Google login
app.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
// Callback route for Google
app.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: 'http://localhost:5173/documents',
    failureRedirect: '/auth/google/failure'
}));
// Failure route if login fails
app.get('/auth/google/failure', (req, res) => {
    res.send('Failed to login');
});
// Example of a protected route where userId is used
// app.get('/protected', (req, res) => {
//   if (!req.isAuthenticated()) {
//     return res.redirect('/auth/google'); // Redirect to login if not authenticated
//   }
//   // Use the userId from session to query user data
//   const userId = req.user.id;
//   // User.findById(userId, (err, user) => {
//   //   if (err || !user) {
//   //     return res.status(404).send('User not found');
//   //   }
//     // You can now use user data for querying the routes
//     res.json(user); // Send the user data as a response (or whatever you need)
//   });
// });
// Function to extract text from PDF
const extractTextFromPDF = (fileBuffer) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pdf = yield getDocument({ data: new Uint8Array(fileBuffer) }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = yield pdf.getPage(i);
            const content = yield page.getTextContent();
            text += content.items.map((item) => item.str).join(" ") + "\n";
        }
        return text.trim(); // Ensure no leading/trailing whitespace
    }
    catch (error) {
        console.error("Error extracting text from PDF:", error);
        return ""; // Return empty string on failure
    }
});
// Function to extract text using OCR
const extractTextUsingOCR = (fileBuffer) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Starting OCR with buffer size:", fileBuffer.length);
        const result = yield Tesseract.recognize(fileBuffer, 'eng', {
            logger: (m) => console.log(m),
        });
        return result.data.text;
    }
    catch (error) {
        console.error("OCR Error:", error);
        throw new Error("Failed to perform OCR on image.");
    }
});
// Helper function to clean up extracted text
const cleanExtractedText = (text) => {
    const resultedtext = text.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim();
    return resultedtext;
};
// Function to analyze contract using AI
const analyzeContractWithAI = (contractText) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = `
    Analyze the following document and provide a brief summary in 2  lines  .
    Provide the response in JSON format with the following keys:
    - summary: the document summary.

    Document text:
    ${contractText.substring(0, 2000)}
  `;
    try {
        const results = yield AI_MODEL_INSTANCE.generateContent(prompt);
        // Extract and clean response text
        let responseText = results.response.text().trim();
        // Remove any markdown code block markers (e.g., ```json or ```)
        responseText = responseText.replace(/```json|```/g, "").trim();
        // Parse the cleaned response text as JSON
        const parsedResponse = JSON.parse(responseText);
        return parsedResponse;
    }
    catch (error) {
        console.error("Error analyzing contract with AI:", error);
        // Provide additional context for debugging
        if (error instanceof SyntaxError) {
            console.error("Response likely contains invalid JSON:", error.message);
        }
        throw new Error("Failed to analyze contract");
    }
});
app.use(passport.initialize());
app.use(passport.session()); // For handling persistent login sessions
// Serialize user into session
passport.serializeUser((user, done) => {
    done(null, user.id); // Store the user id in the session
});
// Deserialize user from session
passport.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({
            where: {
                id: (id),
            }
        }); // Use await instead of the callback
        done(null, user); // Pass the user to done
    }
    catch (err) {
        done(err); // If there's an error, pass it to done
    }
}));
// Route for Google login
app.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
// Callback route for Google
app.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/documents',
    failureRedirect: '/auth/google/failure'
}));
// Failure route if login fails
app.get('/auth/google/failure', (req, res) => {
    res.send('Failed to login');
});
import jwt from "jsonwebtoken";
const generateToken = (user) => {
    return jwt.sign({ googleId: user.googleId }, // Payload
    process.env.JWT_SECRET, // Secret key
    { expiresIn: "10h" } // Token expiration time
    );
};
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.body; // Token sent from the frontend
    if (!token) {
        return res.status(400).json({ message: "Token is required" });
    }
    try {
        // Decode the JWT token
        const decodedToken = jwt.decode(token); // Explicitly typing the decoded token
        if (!decodedToken || !decodedToken.sub) {
            return res.status(400).json({ message: "Invalid token or Google ID not found" });
        }
        const googleId = decodedToken.sub; // This is the Google ID (string)
        const email = decodedToken.email || ""; // Fallback to empty string if email is not present
        const name = decodedToken.name || ""; // Fallback to empty string if name is not present
        // Check if the user exists in the database
        let user = yield prisma.user.findUnique({
            where: { googleId },
        });
        if (!user) {
            // If user does not exist, create a new user
            user = yield prisma.user.create({
                data: {
                    googleId,
                    email,
                    name,
                },
            });
            return res.status(201).json({ message: "New user created", user });
        }
        // Generate a new JWT for the user
        const newToken = generateToken(user); // Replace with your JWT generation logic
        res.status(200).json({ message: "Login successful", token: newToken });
    }
    catch (error) {
        console.error("Login failed:", error);
        res.status(500).json({ message: "Login failed", error: error.message });
    }
}));
app.use('/auth', authrouter);
// Upload endpoint
app.use('/notes', notesrouter);
app.use('/diary', diaryrouter);
app.use('/events', eventsrouter);
// Updated /upload endpoint
// Updated /upload endpoint
app.post("/upload", authenticateToken, upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const { title } = req.body;
        const fileBuffer = req.file.buffer;
        const fileKey = req.file.originalname.toLowerCase();
        // Extract text based on file type
        let extractedText = "";
        if (fileKey.endsWith(".pdf")) {
            extractedText = yield extractTextFromPDF(fileBuffer);
        }
        else if (fileKey.endsWith(".docx")) {
            // Handle Word documents
            const result = yield mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = result.value;
        }
        else if (fileKey.match(/\.(png|jpg|jpeg|tiff|bmp)$/)) {
            // Handle images with OCR
            extractedText = yield extractTextUsingOCR(fileBuffer);
        }
        else {
            return res.status(400).json({ error: "Unsupported file format. Please upload a PDF, DOCX, PNG, or JPEG." });
        }
        // Clean the extracted text
        extractedText = cleanExtractedText(extractedText);
        if (!extractedText) {
            return res.status(400).json({ error: "Failed to extract text from the uploaded file." });
        }
        // Analyze the extracted text using AI
        const analysis = yield analyzeContractWithAI(extractedText);
        // Store the file and analysis in MongoDB
        const newDocument = new FileModel({
            title,
            parsedResponse: analysis.summary,
            userId: googleId,
            fileKey,
            data: fileBuffer,
            extractedText,
        });
        yield newDocument.save();
        res.status(200).json({
            message: "File uploaded and analyzed successfully",
            documentId: newDocument._id,
            summary: analysis.summary,
        });
    }
    catch (error) {
        console.error("Error uploading and processing file:", error);
        res.status(500).json({ error: "Failed to upload and process file." });
    }
}));
// Middleware to authenticate the token
function authenticateToken(req, res, next) {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Access denied, no token provided" });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ message: "Token is not valid" });
        req.user = user; // Attach user info to the request object
        next();
    });
}
app.get('/documents', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // Fetch documents belonging to the logged-in user
        const documents = yield FileModel.find({ userId: googleId }, "title _id parsedResponse");
        res.json(documents); // Respond with documents as JSON
    }
    catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Failed to fetch documents." });
    }
}));
// Fetch a specific document by its ID and the user's googleId
app.get('/documents/:id', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
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
        // Fetch the document for the specific user
        const document = yield FileModel.findOne({ _id: id, userId: googleId }); // Ensure the document belongs to the user
        if (!document || !document.data) {
            console.log("Document data length:");
            return res.status(404).send("Document not found or access denied");
        }
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename=document-${id}.pdf`,
        }); // Set the content type for PDFs
        res.send(document.data); // Send the PDF data
    }
    catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).send("Error fetching document");
    }
}));
// Analyze endpoint
// app.get("/analyze/:fileKey", async (req, res) => {
//   try {
//     const { fileKey } = req.params;
//     // Fetch file from MongoDB
//     const file = await FileModel.findOne({ fileKey });
//     if (!file) {
//       return res.status(404).json({ error: "File not found" });
//     }
//     // Extract text from PDF
//     const text = await extractTextFromPDF(file.data);
//     console.log("Extracted Text: ", text);
//     // Validate extracted text
//     if (!text || text.trim().length === 0) {
//       return res.status(400).json({ error: "Failed to extract text from PDF" });
//     }
//     // Analyze contract text with AI
//     const analysis = await analyzeContractWithAI(text);
//     res.status(200).json({ analysis });
//   } catch (error) {
//     console.error("Error analyzing file:", error);
//     res.status(500).json({ error: "Failed to analyze file" });
//   }
// });
// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
