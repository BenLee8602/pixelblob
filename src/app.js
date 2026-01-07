import path from "path";
import os from "os";
import express from "express";
import cors from "cors";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import usersRouter from "./routes/users.js";
import postsRouter from "./routes/posts.js";
import commentsRouter from "./routes/comments.js";
import followsRouter from "./routes/follows.js";
import likesRouter from "./routes/likes.js";


const app = express();

app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.static("client/build"));
app.use(express.static(path.join(os.tmpdir(), "pixelblob", "static")));

app.use(cors({ origin: "*" }));

app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/follows", followsRouter);
app.use("/api/likes", likesRouter);

app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "..", "client", "build", "index.html"));
});


export default app;

