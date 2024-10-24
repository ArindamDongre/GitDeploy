import { createClient, commandOptions } from "redis";
import { downloadAndUnzipS3Folder, copyFinalBuild } from "./aws";
import { buildProject } from "./utils"; // Import the build function

const subscriber = createClient();
subscriber.connect();

const publisher = createClient();
publisher.connect();

async function main() {
  while (true) {
    const res = await subscriber.brPop(
      commandOptions({ isolated: true }),
      "build-queue",
      0
    );

    const id = res!.element;
    const zipFilePath = `output/${id}.zip`; // Construct the ZIP file path
    const projectPath = `output/${id}`; // The folder where the project is unzipped
    console.log(`Attempting to download ZIP file: ${zipFilePath}`);

    try {
      // Download and unzip the project folder
      await downloadAndUnzipS3Folder(zipFilePath);
      console.log(`Successfully unzipped ${zipFilePath}`);

      // After unzipping, build the project
      await buildProject(projectPath);
      console.log(`Successfully built project at ${projectPath}`);

      // After building the project, copy build folder to the S3
      await copyFinalBuild(id);
      console.log(`Successfully deployed to S3`);
    } catch (error) {
      console.error(`Deployment Failed:`, error);
    }
    publisher.hSet("status", id, "deployed");
  }
}

main().catch(console.error);
