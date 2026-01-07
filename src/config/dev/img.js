import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import os from "os";

import data from "./data.js";


const imgdir = path.join(os.tmpdir(), "pixelblob", "static", "img");

let curImages;


async function fileExists(filepath) {
    try {
        await fs.stat(filepath);
    } catch (err) {
        if (err.code === "ENOENT") return false;
        throw err;
    }
    return true;
}


function generateImageSize() {
    return 256 - Math.floor(128 * Math.random());
}

function generateImageName() {
    const seed = crypto.randomBytes(16);
    const width = generateImageSize();
    const height = generateImageSize();
    return seed.toString("hex") + '-' + width + '-' + height;
}


async function getImage(imageName) {
    if (!imageName) return "";
    if (!curImages.has(imageName))
        throw "image not found: " + imageName;
    if (await fileExists(path.join(imgdir, imageName)))
        return "http://localhost:3000/img/" + imageName;
    return "https://picsum.photos/seed/" + imageName.replaceAll('-', '/');
}


async function putImage(imageName, imageBuffer, contentType) {
    curImages.add(imageName);
    if (imageBuffer.toString() !== "dummy")
        await fs.writeFile(path.join(imgdir, imageName), imageBuffer);
}


async function deleteImage(imageName) {
    if (!curImages.has(imageName))
        throw "image not found: " + imageName;
    curImages.delete(imageName);
    await fs.rm(
        path.join(imgdir, imageName),
        { recursive: true, force: true }
    );
}


async function resetImages() {
    curImages = new Set(data.images);
    await fs.rm(imgdir, { recursive: true, force: true });
    await fs.mkdir(imgdir, { recursive: true });
}

function getImages() {
    return [...curImages];
}


resetImages();

export default {
    generateImageName,
    getImage,
    putImage,
    deleteImage,

    resetImages,
    getImages
};

