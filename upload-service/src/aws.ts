import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadFile = async (fileName: string, localFilePath: string) => {
  try {
    // Create a read stream for the file
    const fileStream = fs.createReadStream(localFilePath);

    // Prepare upload parameters
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME!, // Use your actual bucket name
      Key: fileName, // Key is the file path in the S3 bucket
      Body: fileStream,
    };

    // Create and send the command
    const command = new PutObjectCommand(uploadParams);
    const response = await s3.send(command);

    console.log("File uploaded successfully:", response);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error uploading file:", error.message);
    } else {
      console.error("Unknown error uploading file:", error);
    }
  }
};
