// models/servingfile.ts
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
import fs from 'fs';

const uri = "mongodb+srv://azizamanaaa97:easypassword@cluster0.tyjfznw.mongodb.net/second-brain";
const client = new MongoClient(uri);

export default async function downloadFile(fileId: string, destinationPath: string): Promise<void> {
  try {
    await client.connect();
    const db = client.db("fileStorage");
    const bucket = new GridFSBucket(db, { bucketName: "files" });

    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
    const writeStream = fs.createWriteStream(destinationPath);

    downloadStream.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  } catch (err) {
    console.error("Error downloading file:", err);
    throw err;
  } finally {
    await client.close();
  }
}


  // Example usage: Download file with a specific fileId
  // downloadFile('your-file-id-here', './path/to/destination/file.pdf');
  