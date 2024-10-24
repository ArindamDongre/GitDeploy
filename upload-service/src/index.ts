import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import path from "path";
import { generate } from "./utils";
import { createClient } from "redis";
import fs from "fs";
import archiver from "archiver";
import { uploadFile } from "./aws"; // Make sure this path is correct

const subscriber = createClient();
subscriber.connect();

const publisher = createClient();
publisher.connect();

// Express setup
const app = express();
app.use(cors());
app.use(express.json());

// Function to zip a folder
const zipFolder = (source: string, out: string) => {
  return new Promise<void>((resolve, reject) => {
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level
    });

    const output = fs.createWriteStream(out);
    archive.pipe(output);

    archive.directory(source, false); // Zip the entire directory
    archive.finalize();

    output.on("close", () => {
      console.log(`${archive.pointer()} total bytes`);
      console.log("Zipping completed successfully.");
      resolve(); // Resolve the promise
    });

    archive.on("error", (err: Error) => {
      reject(err);
    });
  });
};

// Deploy endpoint
app.post("/deploy", async (req, res) => {
  const repoUrl = req.body.repoUrl;
  const id = generate(); // Generate unique id for the repo
  const outputDir = path.join(__dirname, `output/${id}`);
  const zipFilePath = path.join(__dirname, `output/${id}.zip`);

  console.log(outputDir);

  // Clone the repo
  await simpleGit().clone(repoUrl, outputDir);

  // Zip the cloned directory
  await zipFolder(outputDir, zipFilePath);

  // Upload the ZIP file to S3
  await uploadFile(`output/${id}.zip`, zipFilePath);

  publisher.lPush("build-queue", id);
  publisher.hSet("status", id, "uploaded");

  res.json({ id });
});

app.get("/status", async (req, res) => {
  const id = req.query.id;
  const response = await subscriber.hGet("status", id as string);
  res.json({
    status: response,
  });
});

// Start the server
app.listen(3000);
