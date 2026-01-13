import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
const port = process.env.PORT || 3000;

import db from "./src/config/db.js";
await db.connect();

app.listen(port, () => {
    console.log(`server running on port ${port}`);
});

