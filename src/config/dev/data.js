import path from "path";
import fs from "fs/promises";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let data = {
    users: [],
    tokens: [],
    follows: [],
    posts: [],
    comments: [],
    likes: [],
    images: []
};

try {
    const fileName = path.join(__dirname, "data.json");
    data = JSON.parse(await fs.readFile(fileName));
} catch (err) {
    console.log("failed to load test data:", err);
}

export default data;

