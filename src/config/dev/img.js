import crypto from "crypto";
import data from "./data.js";


let curImages = new Set(data.images);


function generateImageSize() {
    return 256 - Math.floor(128 * Math.random());
}

function generateImageName() {
    const seed = crypto.randomBytes(16);
    const width = generateImageSize();
    const height = generateImageSize();
    return seed.toString("hex") + '/' + width + '/' + height;
}


async function getImage(imageName) {
    if (!imageName) return "";
    if (!curImages.has(imageName)) throw "image not found: " + imageName;
    return "https://picsum.photos/seed/" + imageName;
}


async function putImage(imageName, imageBuffer, contentType) {
    curImages.add(imageName);
}


async function deleteImage(imageName) {
    if (!curImages.has(imageName)) throw "image not found: " + imageName;
    curImages.delete(imageName);
}


function resetImages() {
    curImages = new Set(data.images);
}

function getImages() {
    return [...curImages];
}


export default {
    generateImageName,
    getImage,
    putImage,
    deleteImage,

    resetImages,
    getImages
};

