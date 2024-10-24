import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import unzipper from "unzipper";
import { Readable } from "stream";

dotenv.config(); // Load environment variables from .env file

// Initialize the S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function downloadAndUnzipS3Folder(prefix: string): Promise<void> {
  const Bucket = process.env.AWS_BUCKET_NAME!;

  // Extract the ID from the ZIP file's prefix (since prefix is 'output/id.zip')
  const id = path.basename(prefix, ".zip");

  // Define the paths
  const zipFilePath = path.join(__dirname, prefix); // Full path where the ZIP file will be downloaded
  const outputDir = path.join(__dirname, "output", id); // Unzip into 'output/id' folder

  // Ensure the specific output/id directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create a writable stream for the ZIP file
  const outputFile = fs.createWriteStream(zipFilePath);

  try {
    // Download the ZIP file from S3
    const getObjectParams = { Bucket, Key: prefix };
    const command = new GetObjectCommand(getObjectParams);

    const data = await s3.send(command);
    const s3Stream = data.Body as Readable;

    s3Stream.on("error", (err) => {
      console.error(`Error downloading ${prefix}:`, err);
      throw err; // Throw error if download fails
    });

    // Pipe the S3 stream to the output file
    s3Stream.pipe(outputFile);

    return new Promise<void>((resolve, reject) => {
      outputFile.on("finish", async () => {
        console.log(`Finished downloading ${prefix}`);

        // Unzipping the file into output/id after download
        fs.createReadStream(zipFilePath)
          .pipe(unzipper.Extract({ path: outputDir }))
          .on("close", () => {
            console.log(`Unzipped ${prefix} to ${outputDir}`);
            resolve(); // Resolve once unzipping is complete
          })
          .on("error", (err) => {
            console.error(`Error unzipping ${prefix}:`, err);
            reject(err); // Reject if unzipping fails
          });
      });

      outputFile.on("error", (err) => {
        console.error(`Error writing file ${zipFilePath}:`, err);
        reject(err); // Reject if file writing fails
      });
    });
  } catch (error) {
    console.error(`Failed to download and unzip ${prefix}:`, error);
    throw error; // Rethrow error for further handling
  }
}

export async function copyFinalBuild(id: string) {
  const folderPath = path.join(__dirname, "output", id, "build");
  const files = getAllFiles(folderPath);

  // Process each file for upload to S3
  const uploadPromises = files.map(async (file) => {
    const relativePath = file.slice(folderPath.length + 1).replace(/\\/g, "/");
    return uploadFile(`build/${id}/${relativePath}`, file);
  });

  // Wait for all uploads to complete
  try {
    await Promise.all(uploadPromises);
    return console.log("All files uploaded successfully");
  } catch (error) {
    return console.error("Error uploading files:", error);
  }
}

export const getAllFiles = (folderPath: string): string[] => {
  let response: string[] = [];
  const allFilesAndFolders = fs.readdirSync(folderPath);

  allFilesAndFolders.forEach((file) => {
    const fullFilePath = path.join(folderPath, file);
    if (fs.statSync(fullFilePath).isDirectory()) {
      response = response.concat(getAllFiles(fullFilePath));
    } else {
      response.push(fullFilePath);
    }
  });

  return response;
};

export const uploadFile = async (fileName: string, localFilePath: string) => {
  try {
    const fileContent = fs.readFileSync(localFilePath);
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME!, // Bucket name, replace with your actual bucket
      Key: fileName, // Key is the file path in the S3 bucket
      Body: fileContent,
    };

    const command = new PutObjectCommand(uploadParams);
    const response = await s3.send(command);
    console.log("File uploaded successfully:", response);
  } catch (error) {
    console.error(`Error uploading file ${localFilePath}:`, error);
  }
};
