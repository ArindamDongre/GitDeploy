import { exec } from "child_process";
import path from "path";

export function buildProject(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const projectPath = path.join(__dirname, `${id}`);

    // Step 1: Change directory to the project path
    exec(`cd ${projectPath}`, (err) => {
      if (err) {
        console.error(`Failed to change directory to ${projectPath}:`, err);
        return reject(err);
      }

      console.log(`Changed directory to ${projectPath}`);

      // Step 2: Run `npm install`
      exec("npm install", { cwd: projectPath }, (err, stdout, stderr) => {
        if (err) {
          console.error("Failed to run npm install:", stderr);
          return reject(err);
        }

        console.log(`npm install output:\n${stdout}`);

        // Step 3: After successful `npm install`, run `npm run build`
        exec("npm run build", { cwd: projectPath }, (err, stdout, stderr) => {
          if (err) {
            console.error("Failed to run npm run build:", stderr);
            return reject(err);
          }

          console.log(`npm run build output:\n${stdout}`);
          resolve(); // Resolve when the build process completes successfully
        });
      });
    });
  });
}
