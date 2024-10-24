import express from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const app = express();

app.get("/*", async (req, res) => {
  try {
    const host = req.hostname;
    const id = host.split(".")[0]; // Extract the ID from the subdomain
    console.log(id);
    const filePath = req.path; // The file path requested by the user

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `build/${id}${filePath}`,
    });

    // Get the file from S3
    const data = await s3.send(command);

    // Convert the file content from stream to buffer
    const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
      const chunks: any[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    };

    const contents = await streamToBuffer(data.Body as Readable);

    // Determine the file content type
    const contentType = filePath.endsWith(".html")
      ? "text/html"
      : filePath.endsWith(".css")
      ? "text/css"
      : "application/javascript";

    res.set("Content-Type", contentType);
    res.send(contents);
  } catch (error) {
    console.error("Error fetching file from S3:", error);
    res.status(500).send("Error fetching file from S3.");
  }
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
