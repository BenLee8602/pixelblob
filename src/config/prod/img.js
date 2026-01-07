import crypto from "crypto";
import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import isProd from "../isProd.js";


const s3client = isProd ? new S3Client({
    region: process.env.AWS_BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
}) : null;

const imageUrlLifetime = 600;


function generateImageName() {
    return crypto.randomBytes(32).toString("hex");
}


async function getImage(imageName) {
    if (!imageName) return "";
    return await getSignedUrl(
        s3client,
        new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: imageName
        }),
        { expiresIn: imageUrlLifetime }
    );
}


async function putImage(imageName, imageBuffer, contentType) {
    await s3client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageName,
        Body: imageBuffer,
        ContentType: contentType
    }));
}


async function deleteImage(imageName) {
    await s3client.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageName
    }));
}


export default {
    generateImageName,
    getImage,
    putImage,
    deleteImage
};
