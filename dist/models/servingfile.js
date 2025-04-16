var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// models/servingfile.ts
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
import fs from 'fs';
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
export default function downloadFile(fileId, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            const db = client.db("fileStorage");
            const bucket = new GridFSBucket(db, { bucketName: "files" });
            const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
            const writeStream = fs.createWriteStream(destinationPath);
            downloadStream.pipe(writeStream);
            return new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });
        }
        catch (err) {
            console.error("Error downloading file:", err);
            throw err;
        }
        finally {
            yield client.close();
        }
    });
}
// Example usage: Download file with a specific fileId
// downloadFile('your-file-id-here', './path/to/destination/file.pdf');
