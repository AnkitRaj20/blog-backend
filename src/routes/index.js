import express from "express";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const routesDir = __dirname;

/****
 ** Read all route files in the routes directory, dynamically import and use them.
 **
 ** @return {Promise<void>} No return value
 **/
const loadRoutes = async () => {
  const files = fs.readdirSync(routesDir);

  for (const file of files) {
    if (file.endsWith(".route.js")) {
    const routePath = join(routesDir, file);
      // Convert routePath to a file URL
      const routeUrl = pathToFileURL(routePath).href;
      const route = (await import(routeUrl)).default;
    router.use(`/${file.replace(".route.js", "")}`, route);
    }
  }
};

await loadRoutes();

export default router;
